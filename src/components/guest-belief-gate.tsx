"use client";

import Link from "next/link";
import { useAppAuth } from "@/hooks/use-app-auth";

export function GuestBeliefGate() {
  const { login } = useAppAuth();

  return (
    <div className="rounded-2xl border border-zinc-200/80 bg-surface/60 px-4 py-5 text-center dark:border-white/[0.06] dark:bg-surface/50">
      <p className="text-sm font-medium tracking-tight text-zinc-900 dark:text-zinc-100">
        You&apos;ve used your free belief.
      </p>
      <p className="mt-2 text-[13px] leading-relaxed text-zinc-600 dark:text-zinc-400">
        Sign in to keep testing ideas with the Swarm Engine.
      </p>
      <div className="mt-4 flex flex-col items-center gap-2 sm:flex-row sm:justify-center">
        <button
          type="button"
          onClick={() => login()}
          className="inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-cope-orange/30 bg-cope-orange/10 px-4 text-sm font-medium text-cope-orange transition-colors hover:bg-cope-orange/15 sm:w-auto"
        >
          Sign in
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
