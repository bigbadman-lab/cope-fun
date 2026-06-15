"use client";

import { forwardRef, useState } from "react";
import { useTypewriterExamples } from "@/hooks/use-typewriter-examples";

type BeliefInputProps = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  disabled?: boolean;
  compact?: boolean;
  animateExamples?: boolean;
};

export const BeliefInput = forwardRef<HTMLTextAreaElement, BeliefInputProps>(
  function BeliefInput(
    {
      value,
      onChange,
      onSubmit,
      disabled = false,
      compact = false,
      animateExamples = false,
    },
    ref,
  ) {
    const [focused, setFocused] = useState(false);
    const showTypewriter =
      animateExamples && !disabled && !focused && value === "";
    const typewriterText = useTypewriterExamples(showTypewriter);

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
          className={`flex items-end gap-2 rounded-3xl border border-zinc-300/90 bg-surface px-4 py-3 shadow-[0_4px_24px_-6px_rgba(0,0,0,0.08)] transition-[border-color,box-shadow] duration-300 ease-out focus-within:border-zinc-400/95 focus-within:shadow-[var(--belief-input-focus-shadow),0_4px_24px_-6px_rgba(0,0,0,0.08)] dark:border-zinc-700/80 dark:shadow-[0_4px_24px_-6px_rgba(0,0,0,0.22)] dark:focus-within:border-zinc-600/95 dark:focus-within:shadow-[var(--belief-input-focus-shadow),0_4px_24px_-6px_rgba(0,0,0,0.22)] ${
            compact ? "py-2.5" : "py-3.5"
          }`}
        >
          <div className="relative min-h-[24px] flex-1">
            {showTypewriter && typewriterText && (
              <span
                aria-hidden
                className="pointer-events-none absolute inset-0 text-[15px] leading-relaxed text-zinc-500 dark:text-zinc-500"
              >
                {typewriterText}
              </span>
            )}
            <textarea
              ref={ref}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              onKeyDown={handleKeyDown}
              rows={compact ? 1 : 2}
              disabled={disabled}
              className="relative max-h-32 min-h-[24px] w-full resize-none bg-transparent text-[15px] leading-relaxed text-zinc-900 focus:outline-none disabled:opacity-50 dark:text-zinc-100"
            />
          </div>
          <button
            type="submit"
            disabled={!value.trim() || disabled}
            className="flex size-8 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-zinc-50 transition-all hover:bg-zinc-800 disabled:opacity-30 disabled:hover:bg-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white dark:disabled:hover:bg-zinc-100"
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
