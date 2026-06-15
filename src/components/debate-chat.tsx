"use client";

import { AvatarPlaceholder, USER_DISPLAY_NAME } from "./avatar-placeholder";
import { BelieveCopeVote } from "./believe-cope-vote";
import { TYPING_FADE_OUT_MS } from "@/lib/debate-timing";
import type { VoteChoice } from "@/lib/vote";

export type ChatMessage = {
  id: string;
  author: string;
  text: string;
  isUser?: boolean;
};

export const GROUP_FORMATION_TEXT =
  "Cope Engine added Mason, Victor, Logan and Theo";

type ChatMessageRowProps = {
  message: ChatMessage;
  animate?: boolean;
};

export function ChatMessageRow({ message, animate = true }: ChatMessageRowProps) {
  return (
    <div
      className={`flex gap-2.5 ${animate ? "animate-message-in" : ""}`}
    >
      <AvatarPlaceholder
        name={message.isUser ? USER_DISPLAY_NAME : message.author}
      />
      <div className="min-w-0 flex-1 pt-0.5">
        <p className="mb-1 text-xs font-medium text-zinc-500 dark:text-zinc-400">
          {message.isUser ? USER_DISPLAY_NAME : message.author}
        </p>
        <p className="whitespace-pre-line text-[15px] leading-relaxed text-zinc-900 dark:text-zinc-100">
          {message.text}
        </p>
      </div>
    </div>
  );
}

export type AgentTurnMode = "typing" | "fading" | "message";

type AgentTurnRowProps = {
  message: ChatMessage;
  mode: AgentTurnMode;
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

export function AgentTurnRow({ message, mode }: AgentTurnRowProps) {
  return (
    <div className="flex gap-2.5">
      <AvatarPlaceholder name={message.author} />
      <div className="min-w-0 flex-1 pt-0.5">
        {mode === "message" ? (
          <>
            <p className="mb-1 text-xs font-medium text-zinc-400">
              {message.author}
            </p>
            <p className="animate-message-in whitespace-pre-line text-[15px] leading-relaxed text-zinc-900 dark:text-zinc-100">
              {message.text}
            </p>
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
      />
      <button
        type="button"
        onClick={onSaveChat}
        className="rounded-full border border-zinc-300 px-5 py-2 text-sm font-medium text-zinc-600 transition-colors hover:border-zinc-400 hover:text-zinc-900 disabled:opacity-70 dark:border-zinc-700 dark:text-zinc-400 dark:hover:border-zinc-500 dark:hover:text-zinc-200"
        disabled={chatSaved}
      >
        {chatSaved ? "Saved" : "Save Chat"}
      </button>
    </div>
  );
}
