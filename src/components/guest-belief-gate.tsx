"use client";

import Link from "next/link";
import { connectMockWallet } from "@/lib/wallet-session";

export function GuestBeliefGate() {
  return (
    <div className="rounded-2xl border border-zinc-200/80 bg-surface/60 px-4 py-5 text-center dark:border-white/[0.06] dark:bg-surface/50">
      <p className="text-sm font-medium tracking-tight text-zinc-900 dark:text-zinc-100">
        You&apos;ve used your free belief.
      </p>
      <p className="mt-2 text-[13px] leading-relaxed text-zinc-600 dark:text-zinc-400">
        Connect wallet to keep testing ideas with the Cope Engine.
      </p>
      <div className="mt-4 flex flex-col items-center gap-2 sm:flex-row sm:justify-center">
        <button
          type="button"
          onClick={() => connectMockWallet()}
          className="inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-zinc-200/80 bg-background px-4 text-sm font-medium text-zinc-800 transition-colors hover:bg-zinc-50 dark:border-white/10 dark:bg-background dark:text-zinc-200 dark:hover:bg-white/[0.04] sm:w-auto"
        >
          Connect wallet
        </button>
        <Link
          href="/beliefs"
          className="inline-flex min-h-11 w-full items-center justify-center rounded-xl px-4 text-sm font-medium text-zinc-500 transition-colors hover:text-zinc-800 dark:hover:text-zinc-300 sm:w-auto"
        >
          View beliefs
        </Link>
      </div>
    </div>
  );
}
