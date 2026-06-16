"use client";

import { useCallback, useState } from "react";
import {
  REACTION_OPTIONS,
  type MessageReactionCounts,
  type ReactionType,
} from "@/lib/message-reactions";

type ChatMessageReactionsProps = {
  messageId: string;
  counts: MessageReactionCounts;
  currentUserReaction: ReactionType | null;
  onReact: (reaction: ReactionType) => void;
};

const GRID_TRANSITION =
  "grid transition-[grid-template-rows] duration-100 ease-out motion-reduce:transition-none";

const FADE =
  "transition-opacity duration-100 ease-out motion-reduce:transition-none";

function ReactionTriggerIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <circle cx="12" cy="12" r="8.5" />
      <path d="M8.5 10h.01M15.5 10h.01" />
      <path d="M9 14.5a3.5 3.5 0 0 0 6 0" />
    </svg>
  );
}

function reactionButtonClass(active: boolean) {
  return `inline-flex min-h-7 items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] leading-none transition-[color,background-color,border-color,transform] duration-150 active:scale-[0.97] motion-reduce:transition-none motion-reduce:active:transform-none ${
    active
      ? "border-[#fc8401]/45 bg-[#fc8401]/10 text-zinc-800 dark:text-zinc-100"
      : "border-zinc-200/70 bg-transparent text-zinc-500 hover:border-zinc-300 hover:bg-zinc-100/80 hover:text-zinc-700 dark:border-white/[0.08] dark:text-zinc-500 dark:hover:border-white/[0.14] dark:hover:bg-white/[0.04] dark:hover:text-zinc-300"
  }`;
}

function ReactionButton({
  id,
  emoji,
  label,
  count,
  active,
  onClick,
}: {
  id: ReactionType;
  emoji: string;
  label: string;
  count: number;
  active: boolean;
  onClick: (id: ReactionType) => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      aria-label={`${label}, ${count} reactions`}
      onClick={() => onClick(id)}
      className={reactionButtonClass(active)}
    >
      <span aria-hidden className="text-[12px] leading-none">
        {emoji}
      </span>
      <span className="hidden min-[380px]:inline">{label}</span>
      <span
        className={`tabular-nums ${
          active ? "text-[#fc8401]" : "text-zinc-400 dark:text-zinc-600"
        }`}
      >
        {count}
      </span>
    </button>
  );
}

function ExpandedReactionRow({
  messageId,
  counts,
  currentUserReaction,
  onReact,
  className = "",
}: {
  messageId: string;
  counts: MessageReactionCounts;
  currentUserReaction: ReactionType | null;
  onReact: (reaction: ReactionType) => void;
  className?: string;
}) {
  return (
    <div
      role="group"
      aria-label={`Reactions for message ${messageId}`}
      className={`flex flex-wrap items-center gap-1 ${className}`}
    >
      {REACTION_OPTIONS.map(({ id, emoji, label }) => (
        <ReactionButton
          key={id}
          id={id}
          emoji={emoji}
          label={label}
          count={counts[id]}
          active={currentUserReaction === id}
          onClick={onReact}
        />
      ))}
    </div>
  );
}

export function ChatMessageReactions({
  messageId,
  counts,
  currentUserReaction,
  onReact,
}: ChatMessageReactionsProps) {
  const [mobileExpanded, setMobileExpanded] = useState(false);
  const hasReacted = currentUserReaction !== null;
  const selectedOption = REACTION_OPTIONS.find(
    (option) => option.id === currentUserReaction,
  );

  const handleReact = useCallback(
    (reaction: ReactionType) => {
      onReact(reaction);
      setMobileExpanded(false);
    },
    [onReact],
  );

  const toggleMobileExpanded = useCallback(() => {
    setMobileExpanded((expanded) => !expanded);
  }, []);

  const showExpandedMobile = mobileExpanded;
  const showCompactMobile = !mobileExpanded;

  const showExpandedDesktop =
    "md:pointer-events-none md:opacity-0 md:group-hover/message:pointer-events-auto md:group-hover/message:opacity-100 md:group-focus-within/message:pointer-events-auto md:group-focus-within/message:opacity-100";

  const hideCompactDesktop =
    "md:group-hover/message:pointer-events-none md:group-hover/message:opacity-0 md:group-focus-within/message:pointer-events-none md:group-focus-within/message:opacity-0";

  return (
    <div className="mt-1.5" data-message-reactions={messageId}>
      <div
        className={`${GRID_TRANSITION} max-md:grid-rows-[1fr] ${
          hasReacted
            ? "md:grid-rows-[1fr]"
            : "md:grid-rows-[0fr] md:group-hover/message:grid-rows-[1fr] md:group-focus-within/message:grid-rows-[1fr]"
        }`}
      >
        <div className="min-h-0 overflow-hidden">
          <div
            className={`relative ${
              mobileExpanded ? "max-md:min-h-7" : "h-7"
            } md:h-7`}
          >
            {/* Compact: selected chip or mobile trigger */}
            <div
              className={`absolute inset-0 flex items-center ${FADE} ${
                showCompactMobile
                  ? "max-md:pointer-events-auto max-md:opacity-100"
                  : "max-md:pointer-events-none max-md:opacity-0"
              } ${hasReacted ? `md:opacity-100 ${hideCompactDesktop}` : "md:pointer-events-none md:opacity-0"}`}
            >
              {hasReacted && selectedOption ? (
                <button
                  type="button"
                  aria-expanded={mobileExpanded}
                  aria-label={`Your reaction: ${selectedOption.label}, ${counts[selectedOption.id]} total. Tap to change.`}
                  onClick={toggleMobileExpanded}
                  className={`${reactionButtonClass(true)} md:pointer-events-none`}
                >
                  <span aria-hidden className="text-[12px] leading-none">
                    {selectedOption.emoji}
                  </span>
                  <span className="tabular-nums text-[#fc8401]">
                    {counts[selectedOption.id]}
                  </span>
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    aria-expanded={mobileExpanded}
                    aria-label="Add reaction"
                    onClick={toggleMobileExpanded}
                    className="inline-flex min-h-7 min-w-7 items-center justify-center rounded-full text-zinc-400 transition-colors hover:bg-zinc-100/80 hover:text-zinc-600 active:scale-95 dark:text-zinc-600 dark:hover:bg-white/[0.04] dark:hover:text-zinc-400 md:hidden motion-reduce:active:transform-none"
                  >
                    <ReactionTriggerIcon className="size-3.5" />
                  </button>
                  <button
                    type="button"
                    aria-label="Show reactions"
                    className="sr-only md:not-sr-only md:inline-flex md:min-h-7 md:min-w-7 md:items-center md:justify-center md:rounded-full md:text-zinc-500 md:focus-visible:ring-2 md:focus-visible:ring-[#fc8401]/30"
                  >
                    <ReactionTriggerIcon className="size-3.5" />
                  </button>
                </>
              )}
            </div>

            {/* Expanded: full reaction row */}
            <ExpandedReactionRow
              messageId={messageId}
              counts={counts}
              currentUserReaction={currentUserReaction}
              onReact={handleReact}
              className={`items-center ${FADE} ${
                showExpandedMobile
                  ? "max-md:relative max-md:pointer-events-auto max-md:opacity-100"
                  : "max-md:pointer-events-none max-md:opacity-0"
              } md:absolute md:inset-0 md:flex ${showExpandedDesktop}`}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export type { MessageReactionCounts, ReactionType };
