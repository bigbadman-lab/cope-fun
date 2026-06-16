"use client";

import { AvatarPlaceholder, USER_DISPLAY_NAME } from "./avatar-placeholder";
import { BelieveCopeVote } from "./believe-cope-vote";
import {
  ChatMessageReactions,
  type ReactionType,
  type MessageReactionCounts,
} from "./chat-message-reactions";
import { TYPING_FADE_OUT_MS } from "@/lib/debate-timing";
import type { VoteChoice } from "@/lib/vote";

export type ChatMessage = {
  id: string;
  author: string;
  text: string;
  isUser?: boolean;
};

export type MessageReactionProps = {
  counts: MessageReactionCounts;
  userReaction: ReactionType | null;
  onReact: (reaction: ReactionType) => void;
  copeShake?: boolean;
};

export const GROUP_FORMATION_TEXT =
  "Cope Engine added Mason, Victor, Logan and Theo";

type ChatMessageRowProps = {
  message: ChatMessage;
  animate?: boolean;
  reactions?: MessageReactionProps;
};

export function ChatMessageRow({
  message,
  animate = true,
  reactions,
}: ChatMessageRowProps) {
  const isAgent = !message.isUser;
  const showReactions = isAgent && reactions;

  return (
    <div
      className={`flex gap-2.5 ${showReactions ? "group/message" : ""} ${animate ? "animate-message-in" : ""}`}
    >
      <AvatarPlaceholder
        name={message.isUser ? USER_DISPLAY_NAME : message.author}
      />
      <div className="min-w-0 flex-1 pt-0.5">
        <p className="mb-1 text-xs font-medium text-zinc-500 dark:text-zinc-400">
          {message.isUser ? USER_DISPLAY_NAME : message.author}
        </p>
        <p
          className={`whitespace-pre-line text-[15px] leading-relaxed text-zinc-900 dark:text-zinc-100 ${
            reactions?.copeShake ? "animate-cope-message-shake" : ""
          }`}
        >
          {message.text}
        </p>
        {showReactions && (
          <ChatMessageReactions
            messageId={message.id}
            counts={reactions.counts}
            currentUserReaction={reactions.userReaction}
            onReact={reactions.onReact}
          />
        )}
      </div>
    </div>
  );
}

export type AgentTurnMode = "typing" | "fading" | "message";

type AgentTurnRowProps = {
  message: ChatMessage;
  mode: AgentTurnMode;
  reactions?: MessageReactionProps;
};

function TypingDots({ fadingOut }: { fadingOut: boolean }) {
  return (
    <div
      className={`flex items-center gap-1 pt-3 transition-opacity ease-out ${
        fadingOut ? "opacity-0" : "opacity-100"
      }`}
      style={{ transitionDuration: `${TYPING_FADE_OUT_MS}ms` }}
    >
      <span
        className="size-1.5 rounded-full bg-zinc-500 animate-typing-dot"
        style={{ animationDelay: "0ms" }}
      />
      <span
        className="size-1.5 rounded-full bg-zinc-500 animate-typing-dot"
        style={{ animationDelay: "150ms" }}
      />
      <span
        className="size-1.5 rounded-full bg-zinc-500 animate-typing-dot"
        style={{ animationDelay: "300ms" }}
      />
    </div>
  );
}

export function AgentTurnRow({ message, mode, reactions }: AgentTurnRowProps) {
  const showReactions = mode === "message" && reactions;

  return (
    <div className={`flex gap-2.5 ${showReactions ? "group/message" : ""}`}>
      <AvatarPlaceholder name={message.author} />
      <div className="min-w-0 flex-1 pt-0.5">
        {mode === "message" ? (
          <>
            <p className="mb-1 text-xs font-medium text-zinc-400">
              {message.author}
            </p>
            <p
              className={`animate-message-in whitespace-pre-line text-[15px] leading-relaxed text-zinc-900 dark:text-zinc-100 ${
                reactions?.copeShake ? "animate-cope-message-shake" : ""
              }`}
            >
              {message.text}
            </p>
            {showReactions && (
              <ChatMessageReactions
                messageId={message.id}
                counts={reactions.counts}
                currentUserReaction={reactions.userReaction}
                onReact={reactions.onReact}
              />
            )}
          </>
        ) : (
          <TypingDots fadingOut={mode === "fading"} />
        )}
      </div>
    </div>
  );
}

export function GroupFormationMessage({ animate = true }: { animate?: boolean }) {
  return (
    <p
      className={`py-1 text-center text-[11px] leading-relaxed text-zinc-500 dark:text-zinc-600 ${
        animate ? "animate-join-in" : ""
      }`}
    >
      {GROUP_FORMATION_TEXT}
    </p>
  );
}

type DebateCTAProps = {
  believeCount: number;
  copeCount: number;
  userVote: VoteChoice | null;
  onVote: (choice: VoteChoice) => void;
  onSaveChat?: () => void;
  chatSaved?: boolean;
};

export function DebateCTA({
  believeCount,
  copeCount,
  userVote,
  onVote,
  onSaveChat,
  chatSaved = false,
}: DebateCTAProps) {
  return (
    <div className="space-y-3">
      <BelieveCopeVote
        believeCount={believeCount}
        copeCount={copeCount}
        userVote={userVote}
        onVote={onVote}
        variant="room"
      />
      {onSaveChat && (
        <div className="flex justify-center pt-0.5">
          <button
            type="button"
            onClick={onSaveChat}
            className="min-h-11 rounded-lg px-4 py-2 text-sm font-medium text-zinc-500 transition-colors hover:text-zinc-800 disabled:text-emerald-700 dark:text-zinc-500 dark:hover:text-zinc-200 dark:disabled:text-emerald-400/90"
            disabled={chatSaved}
          >
            {chatSaved ? "Saved to beliefs" : "Save this chat"}
          </button>
        </div>
      )}
    </div>
  );
}
