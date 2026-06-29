import Link from "next/link";
import { MarketStatusBadge } from "./market-status-badge";
import { TreasuryConvictionDisplay } from "./treasury-conviction-display";
import { getMarketDisplayStatus } from "@/lib/markets/display-status";
import type { PublicMarket } from "@/lib/markets/types";

type MarketMiniCardProps = {
  market: PublicMarket;
};

function getPoolPercentages(market: PublicMarket) {
  const totalPool = market.believePool + market.copePool;
  if (totalPool <= 0) return { believePct: 50, copePct: 50 };

  const believePct = Math.round((market.believePool / totalPool) * 100);
  return { believePct, copePct: 100 - believePct };
}

function formatMarketTime(market: PublicMarket): string {
  const displayStatus = getMarketDisplayStatus(market.status, market.closesAt);
  const target =
    displayStatus === "open"
      ? market.closesAt
      : market.resolvesAt ?? market.resolvedAt ?? market.closesAt;
  const targetDate = new Date(target);
  const diffMs = targetDate.getTime() - Date.now();

  const dateLabel = targetDate.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });

  if (displayStatus === "awaiting_resolution") {
    return `Closed ${dateLabel} · Awaiting admin resolution`;
  }

  if (diffMs <= 0) {
    if (displayStatus === "open") return `Closed ${dateLabel}`;
    if (displayStatus === "closed") return `Awaiting resolution · ${dateLabel}`;
    return `Resolved ${dateLabel}`;
  }

  const totalMins = Math.floor(diffMs / 60_000);
  const hours = Math.floor(totalMins / 60);
  const days = Math.floor(hours / 24);
  const remaining =
    days > 0
      ? `${days}d ${hours % 24}h`
      : hours > 0
        ? `${hours}h ${totalMins % 60}m`
        : `${totalMins}m`;

  if (displayStatus === "open") {
    return `Closes in ${remaining} · ${dateLabel}`;
  }

  if (displayStatus === "closed") {
    return `Awaiting resolution · ${dateLabel}`;
  }

  return `Resolved ${dateLabel}`;
}

export function MarketMiniCard({ market }: MarketMiniCardProps) {
  const { believePct, copePct } = getPoolPercentages(market);
  const totalPool = market.believePool + market.copePool;

  return (
    <section className="mb-3 overflow-hidden rounded-xl border border-zinc-200/80 bg-surface/60 shadow-[0_8px_30px_-22px_rgba(0,0,0,0.25)] dark:border-white/[0.07] dark:bg-surface/40">
      <Link
        href={`/room/${market.roomSlug}`}
        className="block px-4 py-3.5 transition-colors hover:bg-zinc-900/[0.03] dark:hover:bg-white/[0.03]"
      >
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start gap-2">
            <p className="min-w-0 flex-1 text-[15px] font-medium leading-snug text-zinc-900 dark:text-zinc-100">
              {market.title}
            </p>
            <MarketStatusBadge
              dbStatus={market.status}
              closesAt={market.closesAt}
            />
          </div>

          <p className="mt-1 truncate text-xs text-zinc-500">
            {market.roomBelief}
          </p>

          {market.treasuryConvictionCope > 0 ? (
            <div className="mt-2">
              <TreasuryConvictionDisplay
                amount={market.treasuryConvictionCope}
              />
            </div>
          ) : null}

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

          <p className="mt-2 text-xs text-zinc-500">
            {totalPool.toLocaleString()} credits in pool
            {" · "}
            {market.participantCount}{" "}
            {market.participantCount === 1 ? "participant" : "participants"}
            {" · "}
            {formatMarketTime(market)}
          </p>
        </div>
      </Link>
    </section>
  );
}
