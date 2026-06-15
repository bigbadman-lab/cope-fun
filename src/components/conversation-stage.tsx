"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { BeliefInput } from "./belief-input";
import {
  AgentTurnRow,
  ChatMessageRow,
  DebateCTA,
  GroupFormationMessage,
  type ChatMessage,
} from "./debate-chat";
import type { VoteChoice } from "@/lib/vote";
import { BELIEF_TOP_IN_MAIN } from "@/lib/belief-layout";

const INPUT_SETTLE_MS = 1100;

function getComposerBottomPx(): number {
  const probe = document.createElement("div");
  probe.style.cssText =
    "position:fixed;bottom:var(--composer-bottom);visibility:hidden;pointer-events:none";
  document.body.appendChild(probe);
  const px = parseFloat(getComputedStyle(probe).bottom);
  document.body.removeChild(probe);
  return Number.isFinite(px) ? px : 16;
}

type ConversationStageProps = {
  userMessage: ChatMessage;
  showGroupFormation: boolean;
  typingAgent: string | null;
  typingFadingOut: boolean;
  agentMessages: ChatMessage[];
  visibleAgentCount: number;
  showCta: boolean;
  belief: string;
  inputGlideActive: boolean;
  composerStartCenterY: number | null;
  believeCount: number;
  copeCount: number;
  userVote: VoteChoice | null;
  onVote: (choice: VoteChoice) => void;
  onSaveChat?: () => void;
  chatSaved?: boolean;
};

export function ConversationStage({
  userMessage,
  showGroupFormation,
  typingAgent,
  typingFadingOut,
  agentMessages,
  visibleAgentCount,
  showCta,
  belief,
  inputGlideActive,
  composerStartCenterY,
  believeCount,
  copeCount,
  userVote,
  onVote,
  onSaveChat,
  chatSaved,
}: ConversationStageProps) {
  const inputWrapperRef = useRef<HTMLDivElement>(null);
  const conversationEndRef = useRef<HTMLDivElement>(null);
  const [translateY, setTranslateY] = useState(0);
  const [isGliding, setIsGliding] = useState(false);
  const glideStartedRef = useRef(false);

  useLayoutEffect(() => {
    const inputWrapper = inputWrapperRef.current;
    if (!inputWrapper) return;

    const inputHeight = inputWrapper.offsetHeight;
    const composerBottomPx = getComposerBottomPx();
    const finalCenterY =
      window.innerHeight - composerBottomPx - inputHeight / 2;
    const startCenterY = composerStartCenterY ?? finalCenterY;
    const initialOffset = startCenterY - finalCenterY;

    if (!glideStartedRef.current) {
      setTranslateY(initialOffset);
    }

    if (!inputGlideActive || glideStartedRef.current) return;

    glideStartedRef.current = true;

    const raf = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setIsGliding(true);
        setTranslateY(0);
      });
    });

    return () => cancelAnimationFrame(raf);
  }, [inputGlideActive, composerStartCenterY]);

  useEffect(() => {
    if (
      visibleAgentCount === 0 &&
      !showGroupFormation &&
      !typingAgent &&
      !showCta
    ) {
      return;
    }
    conversationEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
    });
  }, [visibleAgentCount, showGroupFormation, typingAgent, typingFadingOut, showCta, userVote]);

  return (
    <div className="relative h-[calc(100dvh-3.5rem)] w-full">
      <div className="absolute inset-0 overflow-y-auto px-4 pb-composer-scroll">
        <div
          className="mx-auto w-full max-w-md space-y-4"
          style={{ paddingTop: BELIEF_TOP_IN_MAIN }}
        >
          <ChatMessageRow message={userMessage} animate={false} />
          {showGroupFormation && <GroupFormationMessage />}
          {agentMessages.map((message, index) => {
            const isComplete = index < visibleAgentCount;
            const isActive =
              typingAgent === message.author && index === visibleAgentCount;

            if (!isComplete && !isActive) return null;

            return (
              <AgentTurnRow
                key={message.id}
                message={message}
                mode={
                  isComplete
                    ? "message"
                    : typingFadingOut
                      ? "fading"
                      : "typing"
                }
              />
            );
          })}
          {showCta && (
            <DebateCTA
              believeCount={believeCount}
              copeCount={copeCount}
              userVote={userVote}
              onVote={onVote}
              onSaveChat={onSaveChat}
              chatSaved={chatSaved}
            />
          )}
          <div ref={conversationEndRef} aria-hidden />
        </div>
      </div>

      <div
        ref={inputWrapperRef}
        className="fixed inset-x-0 bottom-composer z-50 px-4 will-change-transform"
        style={{
          transform: `translateY(${translateY}px)`,
          transition: isGliding
            ? `transform ${INPUT_SETTLE_MS}ms cubic-bezier(0.22, 1, 0.36, 1)`
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
