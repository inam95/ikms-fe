import { openai } from "@ai-sdk/openai";
import type { UIMessage } from "ai";
import { convertToModelMessages, streamText } from "ai";

export async function POST(request: Request) {
  const {
    messages,
  }: {
    messages: UIMessage[];
    model: string;
    webSearch: boolean;
  } = await request.json();

  const result = streamText({
    model: openai("gpt-5-nano"),
    messages: await convertToModelMessages(messages),
    system: "You are a helpful assistant that can answer questions and help with tasks",
  });

  return result.toUIMessageStreamResponse({
    sendSources: true,
    sendReasoning: true,
  });
}
