"use client";

import { useMemo, useState } from "react";
import { ConvictionNotesFeed } from "./conviction-notes-feed";
import { MarketStatusBadge } from "./market-status-badge";
import { StakePanel } from "./stake-panel";
import type {
  ConvictionNote,
  Market,
  MarketPosition,
  MarketSide,
} from "@/lib/market-types";

type MarketCardProps = {
  market: Market;
};

function getPoolPercentages(believePool: number, copePool: number) {
  const total = believePool + copePool;
  if (total <= 0) return { believePct: 50, copePct: 50 };

  const believePct = Math.round((believePool / total) * 100);
  return { believePct, copePct: 100 - believePct };
}

function formatMarketDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatTimeRemaining(iso: string): string {
  const diffMs = new Date(iso).getTime() - Date.now();
  if (diffMs <= 0) return "Closing complete";

  const mins = Math.floor(diffMs / 60_000);
  const hours = Math.floor(mins / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ${hours % 24}h left`;
  if (hours > 0) return `${hours}h ${mins % 60}m left`;
  return `${mins}m left`;
}

function getNoteSummary(notes: ConvictionNote[]) {
  const believeCount = notes.filter((note) => note.side === "believe").length;
  const copeCount = notes.length - believeCount;

  return {
    totalLabel: `${notes.length} Conviction ${notes.length === 1 ? "Note" : "Notes"}`,
    splitLabel: `${believeCount} Believe · ${copeCount} Cope`,
  };
}

export function MarketCard({ market }: MarketCardProps) {
  const [believePool, setBelievePool] = useState(market.believePool);
  const [copePool, setCopePool] = useState(market.copePool);
  const [position, setPosition] = useState<MarketPosition | null>(
    market.userPosition ?? null,
  );
  const [notes, setNotes] = useState<ConvictionNote[]>(market.notes);

  const totalPool = believePool + copePool;
  const { believePct, copePct } = useMemo(
    () => getPoolPercentages(believePool, copePool),
    [believePool, copePool],
  );
  const stakingDisabled = market.status !== "open";
  const noteSummary = getNoteSummary(notes);

  function handleStake(input: {
    side: MarketSide;
    stakeAmount: number;
    noteBody: string;
  }) {
    const now = new Date().toISOString();

    setPosition((current) => ({
      side: input.side,
      stakeAmount:
        current?.side === input.side
          ? current.stakeAmount + input.stakeAmount
          : input.stakeAmount,
      updatedAt: now,
    }));

    if (input.side === "believe") {
      setBelievePool((current) => current + input.stakeAmount);
    } else {
      setCopePool((current) => current + input.stakeAmount);
    }

    if (input.noteBody) {
      setNotes((current) => [
        {
          id: `local-note:${crypto.randomUUID()}`,
          marketId: market.id,
          userName: "You",
          side: input.side,
          stakeAmount: input.stakeAmount,
          body: input.noteBody,
          createdAt: now,
        },
        ...current,
      ]);
    }
  }

  return (
    <section className="rounded-2xl border border-zinc-200/80 bg-surface/55 p-3.5 shadow-[0_12px_40px_-32px_rgba(0,0,0,0.45)] dark:border-white/[0.07] dark:bg-surface/45 sm:p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="mb-1.5 text-[11px] font-medium uppercase tracking-[0.14em] text-zinc-500">
            Active Market
          </p>
          <h2 className="text-base font-semibold leading-snug tracking-tight text-zinc-950 dark:text-zinc-50">
            {market.title}
          </h2>
        </div>
        <MarketStatusBadge dbStatus={market.status} closesAt={market.closesAt} />
      </div>

      <p className="mt-2 text-[12px] leading-relaxed text-zinc-600 dark:text-zinc-400">
        {market.resolutionCriteria}
      </p>

      <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-zinc-500">
        <span>
          {market.status === "open"
            ? `Closes ${formatMarketDate(market.closesAt)}`
            : `Resolves ${formatMarketDate(market.resolvesAt)}`}
        </span>
        <span className="hidden text-zinc-400 sm:inline" aria-hidden>
          ·
        </span>
        <span>
          {market.status === "open"
            ? formatTimeRemaining(market.closesAt)
            : market.status}
        </span>
      </p>

      <div className="mt-3">
        <div className="mb-2 flex items-baseline justify-between text-xs tabular-nums">
          <span className="text-emerald-700/80 dark:text-emerald-400/80">
            Believe {believePct}%
          </span>
          <span className="text-zinc-500">
            {totalPool.toLocaleString()} total credits
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
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[11px] tabular-nums text-zinc-500">
          <span>
            Believe pool{" "}
            <span className="text-zinc-700 dark:text-zinc-300">
              {believePool.toLocaleString()}
            </span>
          </span>
          <span>
            Cope pool{" "}
            <span className="text-zinc-700 dark:text-zinc-300">
              {copePool.toLocaleString()}
            </span>
          </span>
        </div>
      </div>

      {notes.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-2 rounded-xl border border-zinc-200/70 bg-background/45 px-3 py-2 text-[11px] text-zinc-500 dark:border-white/[0.06] dark:bg-background/30">
          <span className="font-medium text-zinc-700 dark:text-zinc-300">
            {noteSummary.totalLabel}
          </span>
          <span>{noteSummary.splitLabel}</span>
        </div>
      )}

      <div className="mt-3 space-y-3">
        <StakePanel
          position={position}
          disabled={stakingDisabled}
          onStake={handleStake}
        />
        <ConvictionNotesFeed notes={notes} defaultCollapsed={notes.length > 0} />
      </div>
    </section>
  );
}
