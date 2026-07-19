"use client";

import { useMemo } from "react";
import { MarketStatusBadge } from "./market-status-badge";
import { ROOM_MARKET_PANEL_ID } from "./room-market-panel";
import {
  canStakeOnMarket,
  getMarketDisplayStatus,
} from "@/lib/markets/display-status";
import type { RoomMarketView } from "@/lib/markets/types";

function formatMarketTiming(market: RoomMarketView): string {
  const displayStatus = getMarketDisplayStatus(market.status, market.closesAt);

  if (displayStatus === "awaiting_resolution" || displayStatus === "closed") {
    return "Awaiting resolution";
  }

  const target =
    displayStatus === "open"
      ? market.closesAt
      : market.resolvesAt ?? market.resolvedAt ?? market.closesAt;
  const targetDate = new Date(target);
  const dateLabel = targetDate.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });

  if (displayStatus === "resolved") return `Resolved ${dateLabel}`;
  if (displayStatus === "voided") return "Voided · refunded";

  const diffMs = targetDate.getTime() - Date.now();
  if (diffMs <= 0) return `Closed ${dateLabel}`;

  const totalMins = Math.floor(diffMs / 60_000);
  const hours = Math.floor(totalMins / 60);
  const days = Math.floor(hours / 24);
  const remaining =
    days > 0
      ? `${days}d ${hours % 24}h`
      : hours > 0
        ? `${hours}h ${totalMins % 60}m`
        : `${totalMins}m`;

  return `Closes in ${remaining}`;
}

type PinnedMarketHeaderProps = {
  market: RoomMarketView;
};

export function PinnedMarketHeader({ market }: PinnedMarketHeaderProps) {
  const displayStatus = useMemo(
    () => getMarketDisplayStatus(market.status, market.closesAt),
    [market.status, market.closesAt],
  );
  const stakingAllowed = useMemo(
    () => canStakeOnMarket(market.status, market.closesAt),
    [market.status, market.closesAt],
  );

  const totalPool = market.believePool + market.copePool;
  const believePct =
    totalPool > 0 ? Math.round((market.believePool / totalPool) * 100) : 50;
  const copePct = 100 - believePct;
  const timing = formatMarketTiming(market);
  const canParticipate = stakingAllowed && !market.userPosition;

  function scrollToPanel() {
    if (typeof document === "undefined") return;
    document
      .getElementById(ROOM_MARKET_PANEL_ID)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className="bg-background pb-3 pt-0.5">
      <div className="rounded-xl border border-cope-orange/30 bg-background px-3.5 py-3 dark:border-cope-orange/25">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-cope-orange">
            {displayStatus === "open" ? "Open Market" : "Market"}
          </p>
          <MarketStatusBadge dbStatus={market.status} closesAt={market.closesAt} />
        </div>

        <h2 className="mt-2 whitespace-pre-line text-[15px] font-semibold leading-snug tracking-[-0.01em] text-zinc-900 dark:text-zinc-50 sm:text-base">
          {market.title}
        </h2>

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
              className="bg-emerald-600/60 transition-[width] duration-500"
              style={{ width: `${believePct}%` }}
            />
            <div
              className="bg-rose-500/50 transition-[width] duration-500"
              style={{ width: `${copePct}%` }}
            />
          </div>
        </div>

        <div className="mt-2.5 flex items-center justify-between gap-3">
          <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-zinc-500">
            <span>{timing}</span>
            <span aria-hidden>·</span>
            <span>
              {market.participantCount}{" "}
              {market.participantCount === 1 ? "participant" : "participants"}
            </span>
            <span aria-hidden className="hidden sm:inline">
              ·
            </span>
            <span className="hidden sm:inline">
              {totalPool.toLocaleString()} credits
            </span>
          </div>

          {canParticipate ? (
            <button
              type="button"
              onClick={scrollToPanel}
              className="shrink-0 rounded-lg bg-cope-orange px-3 py-1.5 text-xs font-medium text-zinc-950 transition-colors hover:bg-cope-orange/90"
            >
              Participate
            </button>
          ) : market.userPosition ? (
            <span className="shrink-0 rounded-lg border border-zinc-200/80 px-2.5 py-1 text-[11px] font-medium text-zinc-600 dark:border-white/10 dark:text-zinc-300">
              You&apos;re in ·{" "}
              {market.userPosition.side === "believe" ? "Believe" : "Cope"}
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
}
