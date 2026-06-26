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
  interactive?: boolean;
  onSignInRequired?: () => void;
  showSignInHint?: boolean;
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

function reactionButtonClass(active: boolean, readOnly: boolean) {
  return `inline-flex min-h-11 min-w-11 md:min-h-7 md:min-w-0 items-center justify-center gap-1 rounded-full border px-2.5 py-1.5 md:py-0.5 text-[11px] leading-none transition-[color,background-color,border-color,transform] duration-150 active:scale-[0.97] motion-reduce:transition-none motion-reduce:active:transform-none ${
    active
      ? "border-cope-orange/45 bg-cope-orange/10 text-zinc-800 dark:text-zinc-100"
      : readOnly
        ? "border-zinc-200/60 bg-transparent text-zinc-500 dark:border-white/[0.06] dark:text-zinc-500"
        : "border-zinc-200/70 bg-transparent text-zinc-500 hover:border-zinc-300 hover:bg-zinc-100/80 hover:text-zinc-700 dark:border-white/[0.08] dark:text-zinc-500 dark:hover:border-white/[0.14] dark:hover:bg-white/[0.04] dark:hover:text-zinc-300"
  }`;
}

function ReactionButton({
  id,
  emoji,
  label,
  count,
  active,
  readOnly,
  onClick,
}: {
  id: ReactionType;
  emoji: string;
  label: string;
  count: number;
  active: boolean;
  readOnly: boolean;
  onClick: (id: ReactionType) => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      aria-label={`${label}, ${count} reactions`}
      onClick={() => onClick(id)}
      className={reactionButtonClass(active, readOnly)}
    >
      <span aria-hidden className="text-[12px] leading-none">
        {emoji}
      </span>
      <span className="hidden min-[380px]:inline">{label}</span>
      <span
        className={`tabular-nums ${
          active ? "text-cope-orange" : "text-zinc-400 dark:text-zinc-600"
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
  readOnly,
  className = "",
}: {
  messageId: string;
  counts: MessageReactionCounts;
  currentUserReaction: ReactionType | null;
  onReact: (reaction: ReactionType) => void;
  readOnly: boolean;
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
          readOnly={readOnly}
          onClick={onReact}
        />
      ))}
    </div>
  );
}

function hasVisibleCounts(counts: MessageReactionCounts): boolean {
  return REACTION_OPTIONS.some(({ id }) => counts[id] > 0);
}

export function ChatMessageReactions({
  messageId,
  counts,
  currentUserReaction,
  onReact,
  interactive = true,
  onSignInRequired,
  showSignInHint = false,
}: ChatMessageReactionsProps) {
  const [mobileExpanded, setMobileExpanded] = useState(false);
  const readOnly = !interactive;
  const hasReacted = currentUserReaction !== null;
  const selectedOption = REACTION_OPTIONS.find(
    (option) => option.id === currentUserReaction,
  );
  const showCountsOnly =
    readOnly && !hasReacted && hasVisibleCounts(counts);

  const handleInteraction = useCallback(
    (reaction: ReactionType) => {
      if (readOnly) {
        onSignInRequired?.();
        return;
      }
      onReact(reaction);
      setMobileExpanded(false);
    },
    [onReact, onSignInRequired, readOnly],
  );

  const toggleMobileExpanded = useCallback(() => {
    if (readOnly) {
      onSignInRequired?.();
      return;
    }
    setMobileExpanded((expanded) => !expanded);
  }, [onSignInRequired, readOnly]);

  const showExpandedMobile = mobileExpanded;
  const showCompactMobile = !mobileExpanded;

  const showExpandedDesktop =
    "md:pointer-events-none md:opacity-0 md:group-hover/message:pointer-events-auto md:group-hover/message:opacity-100 md:group-focus-within/message:pointer-events-auto md:group-focus-within/message:opacity-100";

  const hideCompactDesktop =
    "md:group-hover/message:pointer-events-none md:group-hover/message:opacity-0 md:group-focus-within/message:pointer-events-none md:group-focus-within/message:opacity-0";

  if (readOnly && !hasReacted && !hasVisibleCounts(counts)) {
    return null;
  }

  return (
    <div className="mt-1.5" data-message-reactions={messageId}>
      {showSignInHint && readOnly && (
        <p className="mb-1 text-[11px] text-cope-orange" role="status">
          Sign in to react.
        </p>
      )}
      <div
        className={`${GRID_TRANSITION} max-md:grid-rows-[1fr] ${
          hasReacted || showCountsOnly
            ? "md:grid-rows-[1fr]"
            : "md:grid-rows-[0fr] md:group-hover/message:grid-rows-[1fr] md:group-focus-within/message:grid-rows-[1fr]"
        }`}
      >
        <div className="min-h-0 overflow-hidden">
          <div
            className={`relative ${
              mobileExpanded ? "max-md:min-h-11" : "max-md:min-h-11 md:h-7"
            }`}
          >
            <div
              className={`absolute inset-0 flex items-center ${FADE} ${
                showCompactMobile
                  ? "max-md:pointer-events-auto max-md:opacity-100"
                  : "max-md:pointer-events-none max-md:opacity-0"
              } ${hasReacted || showCountsOnly ? `md:opacity-100 ${hideCompactDesktop}` : "md:pointer-events-none md:opacity-0"}`}
            >
              {hasReacted && selectedOption ? (
                <button
                  type="button"
                  aria-expanded={mobileExpanded}
                  aria-label={`Your reaction: ${selectedOption.label}, ${counts[selectedOption.id]} total. Tap to change.`}
                  onClick={toggleMobileExpanded}
                  className={`${reactionButtonClass(true, readOnly)} md:pointer-events-none`}
                >
                  <span aria-hidden className="text-[12px] leading-none">
                    {selectedOption.emoji}
                  </span>
                  <span className="tabular-nums text-cope-orange">
                    {counts[selectedOption.id]}
                  </span>
                </button>
              ) : showCountsOnly ? (
                <ExpandedReactionRow
                  messageId={messageId}
                  counts={counts}
                  currentUserReaction={null}
                  onReact={handleInteraction}
                  readOnly={readOnly}
                  className="items-center md:opacity-100"
                />
              ) : (
                <>
                  <button
                    type="button"
                    aria-expanded={mobileExpanded}
                    aria-label={readOnly ? "Sign in to react" : "Add reaction"}
                    onClick={toggleMobileExpanded}
                    className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full text-zinc-400 transition-colors hover:bg-zinc-100/80 hover:text-zinc-600 active:scale-95 dark:text-zinc-600 dark:hover:bg-white/[0.04] dark:hover:text-zinc-400 md:hidden motion-reduce:active:transform-none"
                  >
                    <ReactionTriggerIcon className="size-3.5" />
                  </button>
                  <button
                    type="button"
                    aria-label={readOnly ? "Sign in to react" : "Show reactions"}
                    onClick={readOnly ? toggleMobileExpanded : undefined}
                    className="sr-only md:not-sr-only md:inline-flex md:min-h-7 md:min-w-7 md:items-center md:justify-center md:rounded-full md:text-zinc-500 md:focus-visible:ring-2 md:focus-visible:ring-cope-orange/30"
                  >
                    <ReactionTriggerIcon className="size-3.5" />
                  </button>
                </>
              )}
            </div>

            <ExpandedReactionRow
              messageId={messageId}
              counts={counts}
              currentUserReaction={currentUserReaction}
              onReact={handleInteraction}
              readOnly={readOnly}
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
