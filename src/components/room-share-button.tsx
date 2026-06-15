"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { navIconButtonClass, navIconClass } from "./theme-toggle";

function CopyLinkIcon({ className }: { className?: string }) {
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
      <rect x="9" y="9" width="11" height="11" rx="2" />
      <path d="M5 15V7a2 2 0 0 1 2-2h8" />
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
      aria-label={copied ? "Copied" : "Copy link"}
      className={`${navIconButtonClass} transition-all duration-300 ease-out ${
        copied
          ? "border-emerald-500/35 bg-emerald-500/10 text-emerald-600 dark:border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-400"
          : ""
      }`}
    >
      <span className={`relative block ${navIconClass}`}>
        <CopyLinkIcon
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
