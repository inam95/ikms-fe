"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useState } from "react";

import { Conversation, ConversationContent } from "@/components/ai-elements/conversation";
import { Loader } from "@/components/ai-elements/loader";
import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputBody,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
} from "@/components/ai-elements/prompt-input";
import { Source, Sources, SourcesContent, SourcesTrigger } from "@/components/ai-elements/sources";
import { Suggestion, Suggestions } from "@/components/ai-elements/suggestion";
import { QueryPlan } from "@/components/query-plan";
import { RAGContext } from "@/components/rag-context";

const SUGGESTIONS = [
  "What are vector databases?",
  "How does RAG work?",
  "Explain embedding models",
  "What are the advantages of vector databases?",
];

export default function Home() {
  const [input, setInput] = useState("");

  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/python-be",
    }),
  });

  const handleSubmit = (message: { text?: string }) => {
    if (!message.text) {
      return;
    }
    sendMessage({
      text: message.text,
    });
    setInput("");
  };

  return (
    <div className="relative mx-auto size-full h-screen max-w-4xl p-6">
      <div className="flex h-full flex-col">
        <Conversation className="h-full">
          <ConversationContent>
            {messages.map((message) => (
              <div key={message.id}>
                {message.role === "assistant" &&
                  message.parts.filter((part) => part.type === "source-url").length > 0 && (
                    <Sources>
                      <SourcesTrigger
                        count={message.parts.filter((part) => part.type === "source-url").length}
                      />
                      {message.parts
                        .filter((part) => part.type === "source-url")
                        .map((part, i) => (
                          <SourcesContent key={`${message.id}-${i}`}>
                            <Source key={`${message.id}-${i}`} href={part.url} title={part.url} />
                          </SourcesContent>
                        ))}
                    </Sources>
                  )}
                {/* Sort parts to show: 1. Plan, 2. Reasoning, 3. Context, 4. Text/Answer */}
                {[...message.parts]
                  .sort((a, b) => {
                    const order = {
                      "data-query-plan": 0,
                      reasoning: 1,
                      "data-rag-context": 2,
                      text: 3,
                    };
                    const aOrder = order[a.type as keyof typeof order] ?? 99;
                    const bOrder = order[b.type as keyof typeof order] ?? 99;
                    return aOrder - bOrder;
                  })
                  .map((part, i) => {
                    switch (part.type) {
                      case "data-query-plan":
                        return (
                          <QueryPlan
                            key={`${message.id}-plan-${i}`}
                            plan={(part.data as { plan: string; sub_questions: string[] }).plan}
                            subQuestions={
                              (part.data as { plan: string; sub_questions: string[] }).sub_questions
                            }
                            isStreaming={
                              status === "streaming" &&
                              part === message.parts[message.parts.length - 1] &&
                              message.id === messages.at(-1)?.id
                            }
                          />
                        );
                      case "data-rag-context":
                        return (
                          <RAGContext
                            key={`${message.id}-context-${i}`}
                            context={(part.data as { context: string }).context}
                          />
                        );
                      case "text":
                        return (
                          <Message key={`${message.id}-text-${i}`} from={message.role}>
                            <MessageContent>
                              <MessageResponse>{part.text}</MessageResponse>
                            </MessageContent>
                          </Message>
                        );
                      default:
                        return null;
                    }
                  })}
              </div>
            ))}
            {(() => {
              const lastMsg = messages.at(-1);
              const isSubmitted = status === "submitted";
              const isStreaming = status === "streaming";
              const isAssistant = lastMsg?.role === "assistant";

              // Check if there's a text part with actual content
              const textPart = lastMsg?.parts?.find((part) => part.type === "text");
              const hasTextContent = Boolean(
                textPart && "text" in textPart && textPart.text && textPart.text.trim().length > 0
              );

              const shouldShowThinking =
                isSubmitted || (isStreaming && isAssistant && !hasTextContent);

              return (
                shouldShowThinking && (
                  <Message from="assistant">
                    <MessageContent>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Loader size={14} className="animate-spin" />
                        <span>Thinking...</span>
                      </div>
                    </MessageContent>
                  </Message>
                )
              );
            })()}
          </ConversationContent>
        </Conversation>
        {messages.length === 0 && (
          <Suggestions className="mt-4">
            {SUGGESTIONS.map((text) => (
              <Suggestion
                key={text}
                suggestion={text}
                onClick={(suggestion) => setInput(suggestion)}
              />
            ))}
          </Suggestions>
        )}
        <PromptInput onSubmit={handleSubmit} className="mt-4">
          <PromptInputBody>
            <PromptInputTextarea onChange={(e) => setInput(e.target.value)} value={input} />
          </PromptInputBody>
          <PromptInputFooter>
            <PromptInputSubmit disabled={!input && !status} status={status} />
          </PromptInputFooter>
        </PromptInput>
      </div>
    </div>
  );
}
