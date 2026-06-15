"use client";

import { AvatarPlaceholder, USER_DISPLAY_NAME } from "./avatar-placeholder";
import { TYPING_FADE_OUT_MS } from "@/lib/debate-timing";

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
        <p className="mb-1 text-xs font-medium text-zinc-400">
          {message.isUser ? USER_DISPLAY_NAME : message.author}
        </p>
        <p className="text-[15px] leading-relaxed text-zinc-100">
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
            <p className="animate-message-in text-[15px] leading-relaxed text-zinc-100">
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
      className={`py-1 text-center text-[11px] leading-relaxed text-zinc-600 ${
        animate ? "animate-join-in" : ""
      }`}
    >
      {GROUP_FORMATION_TEXT}
    </p>
  );
}

type DebateCTAProps = {
  onSaveChat?: () => void;
  chatSaved?: boolean;
};

export function DebateCTA({ onSaveChat, chatSaved = false }: DebateCTAProps) {
  return (
    <div className="animate-cta-in flex flex-wrap gap-2 pt-1">
      <button
        type="button"
        className="rounded-full bg-zinc-100 px-5 py-2 text-sm font-medium text-zinc-900 transition-colors hover:bg-white"
      >
        Believe
      </button>
      <button
        type="button"
        className="rounded-full border border-zinc-600 px-5 py-2 text-sm font-medium text-zinc-200 transition-colors hover:border-zinc-400 hover:bg-zinc-800/50"
      >
        Cope
      </button>
      <button
        type="button"
        onClick={onSaveChat}
        className="rounded-full border border-zinc-700 px-5 py-2 text-sm font-medium text-zinc-400 transition-colors hover:border-zinc-500 hover:text-zinc-200 disabled:opacity-70"
        disabled={chatSaved}
      >
        {chatSaved ? "Saved" : "Save Chat"}
      </button>
    </div>
  );
}
