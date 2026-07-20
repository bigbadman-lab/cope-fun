"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  SWARM_TOKEN_CONTRACT_ADDRESS,
  SWARM_TOKEN_EXPLORER_URL,
} from "@/lib/swarm-token";

const COPIED_RESET_MS = 1600;

function CopyIcon({ className }: { className?: string }) {
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
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15V5a2 2 0 0 1 2-2h10" />
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

export function SwarmContractAddressCard() {
  const [copied, setCopied] = useState(false);
  const resetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
    };
  }, []);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(SWARM_TOKEN_CONTRACT_ADDRESS);
      if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
      setCopied(true);
      resetTimerRef.current = setTimeout(() => setCopied(false), COPIED_RESET_MS);
    } catch {
      setCopied(false);
    }
  }, []);

  return (
    <section className="rounded-xl border border-cope-orange/35 bg-cope-orange/[0.06] px-4 py-4 dark:border-cope-orange/25 dark:bg-cope-orange/[0.05]">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
          Official $SWARM Contract
        </h2>
        <span className="rounded-full border border-cope-orange/40 bg-cope-orange/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-zinc-800 dark:text-cope-orange">
          $SWARM is live
        </span>
      </div>
      <p className="mt-1.5 text-[12px] leading-relaxed text-zinc-600 dark:text-zinc-400">
        Deployed on Robinhood Chain. Only trust this official contract address.
      </p>
      <div className="mt-3 flex items-start gap-2">
        <a
          href={SWARM_TOKEN_EXPLORER_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="min-w-0 flex-1 break-all font-mono text-[12px] leading-relaxed text-zinc-900 underline decoration-cope-orange/35 underline-offset-2 transition-colors hover:text-cope-orange hover:decoration-cope-orange/70 dark:text-zinc-100 sm:text-[13px]"
        >
          {SWARM_TOKEN_CONTRACT_ADDRESS}
        </a>
        <button
          type="button"
          onClick={() => void handleCopy()}
          aria-label={copied ? "Copied" : "Copy contract address"}
          className={`inline-flex size-9 shrink-0 items-center justify-center rounded-lg border transition-colors ${
            copied
              ? "border-emerald-500/35 bg-emerald-500/10 text-emerald-600 dark:border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-400"
              : "border-zinc-200/80 bg-background text-zinc-600 hover:bg-zinc-50 dark:border-white/10 dark:bg-background dark:text-zinc-300 dark:hover:bg-white/[0.04]"
          }`}
        >
          <span className="relative block size-4">
            <CopyIcon
              className={`absolute inset-0 size-4 transition-all duration-200 ${
                copied ? "scale-75 opacity-0" : "scale-100 opacity-100"
              }`}
            />
            <CheckIcon
              className={`absolute inset-0 size-4 transition-all duration-200 ${
                copied ? "scale-100 opacity-100" : "scale-75 opacity-0"
              }`}
            />
          </span>
        </button>
      </div>
      <p
        className={`mt-1.5 min-h-4 text-[11px] font-medium transition-opacity ${
          copied
            ? "text-emerald-600 opacity-100 dark:text-emerald-400"
            : "opacity-0"
        }`}
        aria-live="polite"
      >
        Copied
      </p>
    </section>
  );
}
