"use client";

import { forwardRef } from "react";

type BeliefInputProps = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  disabled?: boolean;
  compact?: boolean;
};

export const BeliefInput = forwardRef<HTMLTextAreaElement, BeliefInputProps>(
  function BeliefInput(
    { value, onChange, onSubmit, disabled = false, compact = false },
    ref,
  ) {
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (value.trim() && !disabled) onSubmit();
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (value.trim() && !disabled) onSubmit();
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div
        className={`flex items-end gap-2 rounded-3xl border border-zinc-700/80 bg-surface px-4 py-3 shadow-lg shadow-black/20 transition-colors focus-within:border-zinc-500 ${
          compact ? "py-2.5" : "py-3.5"
        }`}
      >
        <textarea
          ref={ref}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="I believe..."
          rows={compact ? 1 : 2}
          disabled={disabled}
          className="max-h-32 min-h-[24px] flex-1 resize-none bg-transparent text-[15px] leading-relaxed text-zinc-100 placeholder:text-zinc-500 focus:outline-none disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!value.trim() || disabled}
          className="flex size-8 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-zinc-900 transition-all hover:bg-white disabled:opacity-30 disabled:hover:bg-zinc-100"
          aria-label="Submit belief"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            aria-hidden
          >
            <path
              d="M8 3L8 13M8 3L4 7M8 3L12 7"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>
    </form>
  );
  },
);
