"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { PULSE_BELIEF_ROOM_ID } from "@/lib/pulse/constants";
import {
  formatPulseCountdown,
  formatPulsePrice,
  pulseRoundStateLabel,
  pulseWinningSideLabel,
} from "@/lib/pulse/display";
import { formatPulseSeedCreditsLabel } from "@/lib/pulse/pool";
import type { PulseStatusResponse } from "./use-pulse-room";

const POLL_INTERVAL_MS = 3000;

type PulseMarketCardProps = {
  roomSlug: string;
  belief: string;
  initialStatus?: PulseStatusResponse | null;
};

export function PulseMarketCard({
  roomSlug,
  belief,
  initialStatus = null,
}: PulseMarketCardProps) {
  const [status, setStatus] = useState<PulseStatusResponse | null>(
    initialStatus,
  );

  const loadStatus = useCallback(async () => {
    try {
      const response = await fetch(
        `/api/pulse/status?beliefRoomId=${encodeURIComponent(PULSE_BELIEF_ROOM_ID)}`,
        { cache: "no-store" },
      );

      if (response.status === 404) return;

      const payload = (await response.json()) as PulseStatusResponse;
      if (payload.ok) {
        setStatus(payload);
      }
    } catch {
      // Keep last good snapshot if a single poll fails.
    }
  }, []);

  useEffect(() => {
    void loadStatus();
    const interval = window.setInterval(() => {
      void loadStatus();
    }, POLL_INTERVAL_MS);

    return () => window.clearInterval(interval);
  }, [loadStatus]);

  if (!status || !status.ok) {
    if (!initialStatus) {
      return (
        <section className="mb-6 rounded-xl border border-cope-orange/25 bg-surface/60 px-4 py-3.5 dark:border-cope-orange/20 dark:bg-surface/40">
          <p className="text-xs text-zinc-500">Loading Pulse…</p>
        </section>
      );
    }
    return null;
  }

  const { engine, round, livePrice, derived } = status;
  const believePct = round?.believePercent ?? 50;
  const copePct = round?.copePercent ?? 50;
  const seedLabel = round ? formatPulseSeedCreditsLabel(round.seedCredits) : null;
  const isOpen = derived.isOpen;
  const winner = derived.currentlyWinningSide;

  return (
    <section className="mb-6 overflow-hidden rounded-xl border border-cope-orange/35 bg-gradient-to-br from-cope-orange/[0.08] via-surface/70 to-surface/50 shadow-[0_8px_30px_-18px_rgba(122,153,0,0.35)] dark:shadow-[0_8px_30px_-18px_rgba(204,254,2,0.30)] dark:border-cope-orange/25 dark:from-cope-orange/[0.06] dark:via-surface/50 dark:to-surface/30">
      <Link href={`/room/${roomSlug}`} className="block px-4 py-3.5 transition-colors hover:bg-cope-orange/[0.04]">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-cope-orange/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-cope-orange">
                <span className="size-1.5 animate-pulse rounded-full bg-cope-orange" />
                Pulse Live
              </span>
              <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-200">
                {engine.displayPair}
              </span>
              <span className="text-[11px] text-zinc-400">
                #{round?.roundNumber ?? "—"}
              </span>
            </div>

            <p className="mt-2 line-clamp-2 text-[15px] font-medium leading-snug text-zinc-900 dark:text-zinc-100">
              {belief}
            </p>

            <div className="mt-2.5 flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-[10px] uppercase tracking-wide text-zinc-500">
                  Live price
                </p>
                <p className="font-mono text-2xl font-bold tabular-nums text-zinc-900 dark:text-zinc-50">
                  {livePrice.price !== null
                    ? formatPulsePrice(livePrice.price)
                    : "Unavailable"}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] uppercase tracking-wide text-zinc-500">
                  {isOpen ? "Ends in" : "Status"}
                </p>
                <p className="font-mono text-lg font-semibold tabular-nums text-zinc-800 dark:text-zinc-100">
                  {isOpen
                    ? formatPulseCountdown(derived.secondsRemaining)
                    : pulseRoundStateLabel(
                        round?.status ?? null,
                        derived.secondsRemaining,
                      )}
                </p>
              </div>
            </div>

            <div className="mt-3">
              <div className="mb-1.5 flex items-baseline justify-between gap-3 text-[11px] tabular-nums">
                <span className="text-emerald-700/80 dark:text-emerald-400/80">
                  Believe {believePct}%
                </span>
                <span className="text-rose-700/80 dark:text-rose-400/80">
                  Cope {copePct}%
                </span>
              </div>
              <div className="flex h-1.5 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800/80">
                <div
                  className="bg-emerald-600/60"
                  style={{ width: `${believePct}%` }}
                />
                <div
                  className="bg-rose-500/50"
                  style={{ width: `${copePct}%` }}
                />
              </div>
            </div>

            <p className="mt-2 text-xs text-zinc-500">
              {pulseRoundStateLabel(round?.status ?? null, derived.secondsRemaining)}
              {winner ? ` · ${pulseWinningSideLabel(winner)} winning` : ""}
              {" · "}
              {(round?.totalPool ?? 0).toLocaleString()} credits in pool
            </p>
            {seedLabel ? (
              <p className="mt-0.5 text-[11px] text-zinc-500">{seedLabel}</p>
            ) : null}
          </div>
        </div>
      </Link>
    </section>
  );
}
