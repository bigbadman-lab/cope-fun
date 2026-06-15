"use client";

import { useEffect, useRef, useState } from "react";
import {
  AgentTurnRow,
  ChatMessageRow,
  type AgentTurnMode,
  type ChatMessage,
} from "./debate-chat";
import { TopNav } from "./top-nav";
import { scheduleScriptedConversation } from "@/lib/scripted-conversation-timing";

type AnimatedConversationProps = {
  messages: ChatMessage[];
};

export function AnimatedConversation({ messages }: AnimatedConversationProps) {
  const [shownUserIndices, setShownUserIndices] = useState<Set<number>>(
    () => new Set(),
  );
  const [agentTurns, setAgentTurns] = useState<
    Record<number, AgentTurnMode>
  >({});
  const conversationEndRef = useRef<HTMLDivElement>(null);
  const generationRef = useRef(0);

  useEffect(() => {
    const generation = ++generationRef.current;

    return scheduleScriptedConversation(messages, {
      onShowUser: (index) => {
        if (generationRef.current !== generation) return;
        setShownUserIndices((current) => new Set(current).add(index));
      },
      onAgentTypingStart: (index) => {
        if (generationRef.current !== generation) return;
        setAgentTurns((current) => ({ ...current, [index]: "typing" }));
      },
      onAgentTypingFade: (index) => {
        if (generationRef.current !== generation) return;
        setAgentTurns((current) =>
          current[index] ? { ...current, [index]: "fading" } : current,
        );
      },
      onAgentMessage: (index) => {
        if (generationRef.current !== generation) return;
        setAgentTurns((current) => ({ ...current, [index]: "message" }));
      },
    });
  }, [messages]);

  useEffect(() => {
    conversationEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
    });
  }, [shownUserIndices, agentTurns]);

  return (
    <div className="flex min-h-full flex-col">
      <TopNav />
      <main className="flex-1 overflow-y-auto pt-14">
        <div className="mx-auto w-full max-w-md space-y-4 px-4 py-6">
          {messages.map((message, index) => {
            if (message.isUser) {
              if (!shownUserIndices.has(index)) return null;
              return (
                <ChatMessageRow
                  key={message.id}
                  message={message}
                  animate
                />
              );
            }

            const mode = agentTurns[index];
            if (!mode) return null;

            return (
              <AgentTurnRow
                key={message.id}
                message={message}
                mode={mode}
              />
            );
          })}
          <div ref={conversationEndRef} aria-hidden />
        </div>
      </main>
    </div>
  );
}
