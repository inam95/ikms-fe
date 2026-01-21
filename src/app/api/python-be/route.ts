import { createUIMessageStream, createUIMessageStreamResponse, type UIMessage } from "ai";
import { nanoid } from "nanoid";

const PYTHON_BE_URL = process.env.PYTHON_BE_URL || "http://localhost:8001";

export async function POST(request: Request) {
  try {
    const { messages }: { messages: UIMessage[] } = await request.json();

    // Extract the latest user question from messages
    const lastUserMessage = messages.filter((m) => m.role === "user").pop();

    if (!lastUserMessage) {
      return new Response("No user message found", { status: 400 });
    }

    // Extract text from message parts
    const question = lastUserMessage.parts
      .filter((part) => part.type === "text")
      .map((part) => part.text)
      .join(" ");

    if (!question.trim()) {
      return new Response("No question provided", { status: 400 });
    }

    // Create UI Message Stream
    const stream = createUIMessageStream({
      execute: async ({ writer }) => {
        try {
          // Call Python backend streaming endpoint
          const response = await fetch(`${PYTHON_BE_URL}/qa/stream`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ question }),
          });

          if (!response.ok) {
            throw new Error(`Python backend error: ${response.status} ${response.statusText}`);
          }

          const reader = response.body?.getReader();
          if (!reader) {
            throw new Error("No response body from Python backend");
          }

          const decoder = new TextDecoder();
          let buffer = "";
          const textId = nanoid();

          // Write text-start message
          writer.write({
            type: "text-start",
            id: textId,
          });

          // Read and process SSE stream from Python backend
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n\n");
            buffer = lines.pop() || ""; // Keep incomplete chunk in buffer

            for (const line of lines) {
              if (!line.startsWith("data: ")) continue;

              const data = line.slice(6);
              const trimmedData = data.trim();

              // Handle completion signal
              if (trimmedData === "[DONE]") {
                continue;
              }

              // Handle error signal
              if (trimmedData.startsWith("[ERROR]")) {
                throw new Error(trimmedData.slice(8));
              }

              // Handle plan marker - emit as custom data part
              if (trimmedData.startsWith("[PLAN]")) {
                const planData = JSON.parse(trimmedData.slice(6));
                writer.write({
                  type: "data-query-plan",
                  id: nanoid(),
                  data: planData, // { plan: string, sub_questions: string[] }
                });
                continue;
              }

              // Handle context marker - emit as custom data part
              if (trimmedData.startsWith("[CONTEXT]")) {
                const context = trimmedData.slice(9);
                writer.write({
                  type: "data-rag-context",
                  id: nanoid(),
                  data: { context },
                });
                continue;
              }

              // Handle reasoning marker - emit reasoning parts
              if (trimmedData.startsWith("[REASONING]")) {
                const reasoning = trimmedData.slice(11);
                const reasoningId = nanoid();

                writer.write({ type: "reasoning-start", id: reasoningId });
                writer.write({
                  type: "reasoning-delta",
                  id: reasoningId,
                  delta: reasoning,
                });
                writer.write({ type: "reasoning-end", id: reasoningId });
                continue;
              }

              // Handle source markers (optional enhancement)
              if (trimmedData.startsWith("[SOURCE]")) {
                writer.write({
                  type: "source-url",
                  sourceId: nanoid(),
                  url: "#context",
                  title: "RAG Context",
                });
                continue;
              }

              // Write text delta (preserve original whitespace)
              writer.write({
                type: "text-delta",
                id: textId,
                delta: data,
              });
            }
          }

          // Write text-end message
          writer.write({
            type: "text-end",
            id: textId,
          });
        } catch (error) {
          console.error("Error in stream execution:", error);
          throw error;
        }
      },
      onError: (error) => {
        const message = error instanceof Error ? error.message : String(error);
        console.error("Stream error:", message);
        return `Error: ${message}`;
      },
    });

    return createUIMessageStreamResponse({ stream });
  } catch (error) {
    console.error("Route error:", error);
    return new Response(error instanceof Error ? error.message : "Internal server error", {
      status: 500,
    });
  }
}
