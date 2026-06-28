import Link from "next/link";
import { InnerPageShell } from "./inner-page-shell";
import { MarketListRow } from "./market-list-row";
import {
  formatSeasonDateRange,
  getCurrentSeason,
} from "@/lib/seasons";
import type { PublicMarket } from "@/lib/markets/types";

type MarketsPageProps = {
  open: PublicMarket[];
  closed: PublicMarket[];
  resolved: PublicMarket[];
  voided: PublicMarket[];
};

function SeasonBanner() {
  const currentSeason = getCurrentSeason();

  return (
    <section className="mb-5 rounded-xl border border-zinc-200/80 bg-surface/50 px-4 py-3.5 dark:border-white/[0.07] dark:bg-surface/40">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-cope-orange">
            {currentSeason.name}
          </p>
          <p className="mt-1 text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
            Enter curated Season markets with COPE Credits
          </p>
          <p className="mt-1 text-xs text-zinc-500">
            {formatSeasonDateRange(currentSeason)}
          </p>
        </div>
        <p className="rounded-full border border-zinc-200/80 bg-background/70 px-2.5 py-1 text-[11px] font-medium text-zinc-500 dark:border-white/[0.08] dark:bg-background/40">
          Admin-curated
        </p>
      </div>
    </section>
  );
}

function MarketSection({
  title,
  description,
  markets,
}: {
  title: string;
  description: string;
  markets: PublicMarket[];
}) {
  if (markets.length === 0) return null;

  return (
    <section className="mb-8">
      <header className="mb-3">
        <h2 className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
          {title}
        </h2>
        <p className="mt-1 text-xs text-zinc-500">{description}</p>
      </header>
      <div className="w-full">
        {markets.map((market) => (
          <MarketListRow key={market.id} market={market} />
        ))}
      </div>
    </section>
  );
}

export function MarketsPage({
  open,
  closed,
  resolved,
  voided,
}: MarketsPageProps) {
  const hasMarkets =
    open.length + closed.length + resolved.length + voided.length > 0;

  return (
    <InnerPageShell topFade>
      <div className="inner-page-content w-full max-w-md !py-5">
        <header className="pb-4">
          <h1 className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            Markets
          </h1>
          <p className="mt-1.5 text-sm leading-relaxed text-zinc-500 dark:text-zinc-500">
            Back your conviction with COPE Credits.
          </p>
        </header>

        <SeasonBanner />

        {!hasMarkets ? (
          <div className="py-16 text-center">
            <p className="text-base text-zinc-500">No active markets yet.</p>
            <p className="mt-2 text-sm leading-relaxed text-zinc-500">
              Markets selected by the Cope team will appear here.
            </p>
          </div>
        ) : (
          <>
            <MarketSection
              title="Open"
              description="Open for COPE Credits."
              markets={open}
            />
            <MarketSection
              title="Closed / Awaiting Resolution"
              description="Staking has ended, including markets past their close time awaiting admin action."
              markets={closed}
            />
            <MarketSection
              title="Resolved"
              description="Settled markets with outcomes."
              markets={resolved}
            />
            <MarketSection
              title="Voided"
              description="Markets voided with stakes refunded."
              markets={voided}
            />
          </>
        )}

        <div className="mt-6 flex flex-wrap gap-x-4 gap-y-2 border-t border-zinc-200/80 pt-4 text-sm dark:border-white/[0.06]">
          <Link
            href="/how-markets-work"
            className="font-medium text-cope-orange underline decoration-cope-orange/30 underline-offset-2 transition-colors hover:decoration-cope-orange/60"
          >
            How markets work
          </Link>
          <Link
            href="/leaderboard"
            className="font-medium text-cope-orange underline decoration-cope-orange/30 underline-offset-2 transition-colors hover:decoration-cope-orange/60"
          >
            Leaderboard
          </Link>
          <Link
            href="/cope"
            className="font-medium text-cope-orange underline decoration-cope-orange/30 underline-offset-2 transition-colors hover:decoration-cope-orange/60"
          >
            About $COPE
          </Link>
        </div>
      </div>
    </InnerPageShell>
  );
}
