"use client";

import { useCallback, useState } from "react";
import {
  COPE_TOKEN_MINT_ADDRESS,
  COPE_TOKEN_SOLSCAN_URL,
} from "@/lib/cope-token";

export function CopeTokenMintCard() {
  const [copyState, setCopyState] = useState<"idle" | "copied" | "error">(
    "idle",
  );

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(COPE_TOKEN_MINT_ADDRESS);
      setCopyState("copied");
      window.setTimeout(() => setCopyState("idle"), 2000);
    } catch {
      setCopyState("error");
      window.setTimeout(() => setCopyState("idle"), 2000);
    }
  }, []);

  return (
    <section className="rounded-xl border border-cope-orange/30 bg-cope-orange/[0.06] px-4 py-4 dark:border-cope-orange/25 dark:bg-cope-orange/[0.05]">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
          Token contract
        </h2>
        <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-emerald-700 dark:text-emerald-300">
          Live on Solana
        </span>
      </div>
      <p className="mt-2 text-[13px] leading-relaxed text-zinc-600 dark:text-zinc-400">
        $COPE is live now. Use this mint address when buying, selling, or
        adding the token to your wallet. Always verify the contract before you
        trade.
      </p>
      <p className="mt-3 break-all font-mono text-[12px] leading-relaxed text-zinc-800 dark:text-zinc-200">
        {COPE_TOKEN_MINT_ADDRESS}
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => void handleCopy()}
          className="inline-flex min-h-9 items-center rounded-xl border border-zinc-200/80 bg-background px-3 text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-white/10 dark:bg-background dark:text-zinc-300 dark:hover:bg-white/[0.04]"
        >
          {copyState === "copied"
            ? "Copied"
            : copyState === "error"
              ? "Copy failed"
              : "Copy mint address"}
        </button>
        <a
          href={COPE_TOKEN_SOLSCAN_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-9 items-center rounded-xl border border-zinc-200/80 bg-background px-3 text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-white/10 dark:bg-background dark:text-zinc-300 dark:hover:bg-white/[0.04]"
        >
          View on Solscan
        </a>
      </div>
    </section>
  );
}
