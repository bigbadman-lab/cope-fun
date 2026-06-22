import Link from "next/link";
import { MarketStatusBadge } from "./market-status-badge";
import type { Market } from "@/lib/market-types";

type MarketListRowProps = {
  market: Market;
};

const rowLinkClass = [
  "group -mx-2 block rounded-xl px-2 py-3.5",
  "transition-[background-color,transform] duration-300 ease-out",
  "hover:bg-zinc-900/[0.04] active:bg-zinc-900/[0.06] active:scale-[0.998]",
  "dark:hover:bg-white/[0.04] dark:active:bg-white/[0.06]",
  "sm:py-4",
].join(" ");

function getPoolPercentages(market: Market) {
  if (market.totalPool <= 0) return { believePct: 50, copePct: 50 };

  const believePct = Math.round((market.believePool / market.totalPool) * 100);
  return { believePct, copePct: 100 - believePct };
}

function formatMarketTime(market: Market): string {
  const target = market.status === "open" ? market.closesAt : market.resolvesAt;
  const targetDate = new Date(target);
  const diffMs = targetDate.getTime() - Date.now();

  const dateLabel = targetDate.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });

  if (diffMs <= 0) {
    return market.status === "open" ? `Closed ${dateLabel}` : `Resolved ${dateLabel}`;
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

  return market.status === "open"
    ? `Closes in ${remaining} · ${dateLabel}`
    : `Resolves in ${remaining} · ${dateLabel}`;
}

function formatNotesCount(count: number): string {
  return `${count} ${count === 1 ? "note" : "notes"}`;
}

export function MarketListRow({ market }: MarketListRowProps) {
  const { believePct, copePct } = getPoolPercentages(market);
  const hasNotes = market.notes.length > 0;

  return (
    <div className="border-b border-zinc-200/60 last:border-b-0 dark:border-white/[0.06]">
      <Link href={`/room/${market.roomSlug}`} className={rowLinkClass}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="min-w-0 flex-1 text-[15px] font-medium leading-snug text-zinc-900 transition-colors duration-300 ease-out group-hover:text-zinc-950 dark:text-zinc-100 dark:group-hover:text-white">
                {market.title}
              </p>
              <MarketStatusBadge status={market.status} />
            </div>

            <div className="mt-2">
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

            <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-zinc-500 transition-colors duration-300 ease-out group-hover:text-zinc-600 dark:group-hover:text-zinc-400">
              <span>{market.totalPool.toLocaleString()} total credits</span>
              {hasNotes && (
                <>
                  <span aria-hidden>·</span>
                  <span>{formatNotesCount(market.notes.length)}</span>
                </>
              )}
            </div>
            <p className="mt-1 text-xs text-zinc-500 transition-colors duration-300 ease-out group-hover:text-zinc-600 dark:group-hover:text-zinc-400">
              {formatMarketTime(market)}
            </p>
          </div>
        </div>
      </Link>
    </div>
  );
}
