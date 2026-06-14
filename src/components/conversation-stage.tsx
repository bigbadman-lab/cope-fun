"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { BeliefInput } from "./belief-input";
import {
  ChatMessageRow,
  DebateCTA,
  type ChatMessage,
} from "./debate-chat";
import { BELIEF_TOP_IN_MAIN } from "@/lib/belief-layout";

const INPUT_SETTLE_MS = 1100;
const INPUT_BOTTOM_PADDING_PX = 16;

type ConversationStageProps = {
  userMessage: ChatMessage;
  agentMessages: ChatMessage[];
  visibleAgentCount: number;
  showCta: boolean;
  belief: string;
  inputGlideActive: boolean;
};

export function ConversationStage({
  userMessage,
  agentMessages,
  visibleAgentCount,
  showCta,
  belief,
  inputGlideActive,
}: ConversationStageProps) {
  const stageRef = useRef<HTMLDivElement>(null);
  const inputWrapperRef = useRef<HTMLDivElement>(null);
  const conversationEndRef = useRef<HTMLDivElement>(null);
  const [inputTopPx, setInputTopPx] = useState<number | null>(null);
  const [isSettling, setIsSettling] = useState(false);
  const glideStartedRef = useRef(false);

  useLayoutEffect(() => {
    const stage = stageRef.current;
    const inputWrapper = inputWrapperRef.current;
    if (!stage || !inputWrapper) return;

    const inputHeight = inputWrapper.offsetHeight;
    const stageHeight = stage.clientHeight;
    const centerTop = (stageHeight - inputHeight) / 2;
    const bottomTop = stageHeight - inputHeight - INPUT_BOTTOM_PADDING_PX;

    setInputTopPx(centerTop);

    if (!inputGlideActive || glideStartedRef.current) return;

    glideStartedRef.current = true;

    const raf = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setIsSettling(true);
        setInputTopPx(bottomTop);
      });
    });

    return () => cancelAnimationFrame(raf);
  }, [inputGlideActive]);

  useEffect(() => {
    if (visibleAgentCount === 0 && !showCta) return;
    conversationEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
    });
  }, [visibleAgentCount, showCta]);

  return (
    <div
      ref={stageRef}
      className="relative h-[calc(100dvh-3.5rem)] w-full"
    >
      <div className="absolute inset-0 overflow-y-auto px-4 pb-40">
        <div
          className="mx-auto w-full max-w-md space-y-4"
          style={{ paddingTop: BELIEF_TOP_IN_MAIN }}
        >
          <ChatMessageRow message={userMessage} animate={false} />
          {agentMessages.slice(0, visibleAgentCount).map((message) => (
            <ChatMessageRow key={message.id} message={message} />
          ))}
          {showCta && <DebateCTA />}
          <div ref={conversationEndRef} aria-hidden />
        </div>
      </div>

      <div
        ref={inputWrapperRef}
        className="absolute inset-x-0 px-4 will-change-[top]"
        style={{
          top: inputTopPx ?? "50%",
          transition: isSettling
            ? `top ${INPUT_SETTLE_MS}ms cubic-bezier(0.22, 1, 0.36, 1)`
            : "none",
        }}
      >
        <div className="mx-auto w-full max-w-md">
          <BeliefInput
            value={belief}
            onChange={() => {}}
            onSubmit={() => {}}
            disabled
            compact
          />
        </div>
      </div>
    </div>
  );
}
