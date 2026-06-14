"use client";

import { AvatarPlaceholder } from "./avatar-placeholder";

export type ChatMessage = {
  id: string;
  author: string;
  text: string;
  isUser?: boolean;
};

type ChatMessageRowProps = {
  message: ChatMessage;
  animate?: boolean;
};

export function ChatMessageRow({ message, animate = true }: ChatMessageRowProps) {
  return (
    <div
      className={`flex gap-2.5 ${animate ? "animate-message-in" : ""}`}
    >
      <AvatarPlaceholder name={message.isUser ? "You" : message.author} />
      <div className="min-w-0 flex-1 pt-0.5">
        <p className="mb-1 text-xs font-medium text-zinc-400">
          {message.isUser ? "You" : message.author}
        </p>
        <p className="text-[15px] leading-relaxed text-zinc-100">
          {message.text}
        </p>
      </div>
    </div>
  );
}

export function DebateCTA() {
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
        className="rounded-full border border-zinc-700 px-5 py-2 text-sm font-medium text-zinc-400 transition-colors hover:border-zinc-500 hover:text-zinc-200"
      >
        Save Chat
      </button>
    </div>
  );
}
