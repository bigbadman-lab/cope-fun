"use client";

import { forwardRef, useRef, useState } from "react";
import { useTypewriterExamples } from "@/hooks/use-typewriter-examples";

type BeliefInputProps = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  disabled?: boolean;
  isProcessing?: boolean;
  compact?: boolean;
  animateExamples?: boolean;
  placeholder?: string;
  submitAriaLabel?: string;
  processingAriaLabel?: string;
  helperText?: string;
};

export function SubmitArrowIcon() {
  return (
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
  );
}

export function SubmitButtonLoader() {
  return (
    <span className="flex items-center gap-0.5" aria-hidden>
      {[0, 1, 2].map((index) => (
        <span
          key={index}
          className="size-1 rounded-full bg-current animate-typing-dot"
          style={{ animationDelay: `${index * 150}ms` }}
        />
      ))}
    </span>
  );
}

export const BeliefInput = forwardRef<HTMLTextAreaElement, BeliefInputProps>(
  function BeliefInput(
    {
      value,
      onChange,
      onSubmit,
      disabled = false,
      isProcessing = false,
      compact = false,
      animateExamples = false,
      placeholder,
      submitAriaLabel = "Submit belief",
      processingAriaLabel = "Processing belief",
      helperText,
    },
    ref,
  ) {
    const [focused, setFocused] = useState(false);
    const enterSubmitHandledRef = useRef(false);
    const showTypewriter =
      animateExamples && !disabled && !isProcessing && !focused && value === "";
    const typewriterText = useTypewriterExamples(showTypewriter);
    const canSubmit = Boolean(value.trim()) && !disabled;

    function handleSubmit(e: React.FormEvent) {
      e.preventDefault();
      if (enterSubmitHandledRef.current) {
        enterSubmitHandledRef.current = false;
        return;
      }
      if (canSubmit) onSubmit();
    }

    function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        if (canSubmit) {
          enterSubmitHandledRef.current = true;
          onSubmit();
          window.setTimeout(() => {
            enterSubmitHandledRef.current = false;
          }, 0);
        }
      }
    }

    return (
      <form onSubmit={handleSubmit} className="w-full" aria-busy={isProcessing}>
        {helperText && (
          <p className="mb-2 text-center text-[11px] text-zinc-500 dark:text-zinc-500">
            {helperText}
          </p>
        )}
        <div
          className={`flex items-end gap-2 rounded-3xl border border-zinc-300/90 bg-surface px-4 py-3 shadow-[0_4px_24px_-6px_rgba(0,0,0,0.08)] transition-[border-color,box-shadow] duration-300 ease-out focus-within:border-zinc-400/95 focus-within:shadow-[var(--belief-input-focus-shadow),0_4px_24px_-6px_rgba(0,0,0,0.08)] dark:border-zinc-700/80 dark:shadow-[0_4px_24px_-6px_rgba(0,0,0,0.22)] dark:focus-within:border-zinc-600/95 dark:focus-within:shadow-[var(--belief-input-focus-shadow),0_4px_24px_-6px_rgba(0,0,0,0.22)] ${
            compact ? "py-2.5" : "py-3.5"
          } ${isProcessing ? "border-cope-orange/25 dark:border-cope-orange/20" : ""}`}
          aria-busy={isProcessing}
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
              placeholder={placeholder}
              className={`relative max-h-32 min-h-[24px] w-full resize-none bg-transparent text-[15px] leading-relaxed text-zinc-900 placeholder:text-zinc-500 focus:outline-none dark:text-zinc-100 dark:placeholder:text-zinc-600 ${
                isProcessing ? "opacity-70" : "disabled:opacity-50"
              }`}
            />
          </div>
          <button
            type="submit"
            disabled={!canSubmit}
            className={`flex size-8 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-zinc-50 transition-all hover:bg-zinc-800 active:scale-95 disabled:hover:bg-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white dark:disabled:hover:bg-zinc-100 ${
              isProcessing
                ? "cursor-default bg-zinc-800 dark:bg-white"
                : "disabled:opacity-30"
            }`}
            aria-label={isProcessing ? processingAriaLabel : submitAriaLabel}
            aria-busy={isProcessing}
          >
            {isProcessing ? <SubmitButtonLoader /> : <SubmitArrowIcon />}
          </button>
        </div>
      </form>
    );
  },
);
