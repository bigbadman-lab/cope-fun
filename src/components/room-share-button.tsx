"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { navIconButtonClass, navIconClass } from "./theme-toggle";

function ShareIcon({ className }: { className?: string }) {
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
      <path d="M12 16V6" />
      <path d="M8.5 10.5 12 7l3.5 3.5" />
      <path d="M5 18h14" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
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
      <path d="M5 13l4 4L19 7" />
    </svg>
  );
}

type RoomShareButtonProps = {
  slug: string;
};

const COPIED_RESET_MS = 1400;

export function RoomShareButton({ slug }: RoomShareButtonProps) {
  const [copied, setCopied] = useState(false);
  const resetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
    };
  }, []);

  const handleCopy = useCallback(async () => {
    const url = `${window.location.origin}/room/${slug}`;

    try {
      await navigator.clipboard.writeText(url);
      if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
      setCopied(true);
      resetTimerRef.current = setTimeout(() => setCopied(false), COPIED_RESET_MS);
    } catch {
      setCopied(false);
    }
  }, [slug]);

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label={copied ? "Copied" : "Share link"}
      className={`${navIconButtonClass} transition-all duration-300 ease-out ${
        copied
          ? "border-emerald-500/35 bg-emerald-500/10 text-emerald-600 dark:border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-400"
          : ""
      }`}
    >
      <span className={`relative block ${navIconClass}`}>
        <ShareIcon
          className={`absolute inset-0 ${navIconClass} transition-all duration-300 ease-out ${
            copied ? "scale-75 opacity-0" : "scale-100 opacity-100"
          }`}
        />
        <CheckIcon
          className={`absolute inset-0 ${navIconClass} transition-all duration-300 ease-out ${
            copied ? "scale-100 opacity-100" : "scale-75 opacity-0"
          }`}
        />
      </span>
    </button>
  );
}
