"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { BeliefInput } from "./belief-input";
import {
  AgentTurnRow,
  ChatMessageRow,
  DebateCTA,
  GroupFormationMessage,
  type ChatMessage,
  type MessageReactionProps,
} from "./debate-chat";
import { useMessageReactions } from "@/hooks/use-message-reactions";
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
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputWrapperRef = useRef<HTMLDivElement>(null);
  const conversationEndRef = useRef<HTMLDivElement>(null);
  const [translateY, setTranslateY] = useState(0);
  const [isGliding, setIsGliding] = useState(false);
  const glideStartedRef = useRef(false);

  const visibleAgentMessageIds = useMemo(
    () =>
      agentMessages.slice(0, visibleAgentCount).map((message) => message.id),
    [agentMessages, visibleAgentCount],
  );
  const { getCounts, getUserReaction, react, isShaking } = useMessageReactions(
    belief,
    visibleAgentMessageIds,
  );

  const getReactionProps = useCallback(
    (messageId: string): MessageReactionProps => ({
      counts: getCounts(messageId),
      userReaction: getUserReaction(messageId),
      onReact: (reaction) => react(messageId, reaction),
      copeShake: isShaking(messageId),
    }),
    [getCounts, getUserReaction, react, isShaking],
  );

  useLayoutEffect(() => {
    const dock = inputWrapperRef.current;
    const scroll = scrollRef.current;
    if (!dock || !scroll) return;

    const syncComposerInsets = () => {
      scroll.style.setProperty(
        "--composer-dock-height",
        `${dock.offsetHeight}px`,
      );
    };

    syncComposerInsets();
    const observer = new ResizeObserver(syncComposerInsets);
    observer.observe(dock);

    return () => observer.disconnect();
  }, []);

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
      block: "end",
    });
  }, [visibleAgentCount, showGroupFormation, typingAgent, typingFadingOut, showCta, userVote]);

  return (
    <div className="relative h-[calc(100dvh-3.5rem)] w-full">
      <div
        ref={scrollRef}
        className="absolute inset-0 overflow-y-auto overscroll-contain px-4 pb-composer-scroll"
      >
        <div
          className="mx-auto w-full max-w-md space-y-4"
          style={{ paddingTop: BELIEF_TOP_IN_MAIN }}
        >
          <ChatMessageRow message={userMessage} animate={false} />
          {showGroupFormation && <GroupFormationMessage variant="homepage" />}
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
                reactions={isComplete ? getReactionProps(message.id) : undefined}
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
          <div ref={conversationEndRef} aria-hidden className="h-px shrink-0" />
        </div>
      </div>

      <div
        ref={inputWrapperRef}
        className="fixed inset-x-0 bottom-composer z-50 will-change-transform"
        style={{
          transform: `translateY(${translateY}px)`,
          transition: isGliding
            ? `transform ${INPUT_SETTLE_MS}ms cubic-bezier(0.22, 1, 0.36, 1)`
            : "none",
        }}
      >
        <div
          aria-hidden
          className="conversation-composer-fade pointer-events-none absolute inset-x-0 bottom-full bg-gradient-to-t from-background via-background/90 to-transparent"
        />
        <div className="relative border-t border-zinc-200/80 bg-background px-4 pt-3 pb-3 shadow-[0_-10px_28px_-14px_rgba(0,0,0,0.45)] dark:border-white/5">
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
    </div>
  );
}
