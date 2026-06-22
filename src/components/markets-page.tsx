import { InnerPageShell } from "./inner-page-shell";
import { MarketListRow } from "./market-list-row";
import { getMockMarkets } from "@/lib/mock-markets";

function SeasonBanner() {
  return (
    <section className="mb-5 rounded-xl border border-zinc-200/80 bg-surface/50 px-4 py-3.5 dark:border-white/[0.07] dark:bg-surface/40">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-cope-orange">
            Season 1
          </p>
          <p className="mt-1 text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
            25,000,000 $COPE rewards
          </p>
        </div>
        <p className="rounded-full border border-zinc-200/80 bg-background/70 px-2.5 py-1 text-[11px] font-medium text-zinc-500 dark:border-white/[0.08] dark:bg-background/40">
          30 day competition
        </p>
      </div>
    </section>
  );
}

export function MarketsPage() {
  const markets = getMockMarkets();

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

        {markets.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-base text-zinc-500">No active markets yet.</p>
            <p className="mt-2 text-sm leading-relaxed text-zinc-500">
              Markets selected by the Cope team will appear here.
            </p>
          </div>
        ) : (
          <div className="w-full">
            {markets.map((market) => (
              <MarketListRow key={market.id} market={market} />
            ))}
          </div>
        )}
      </div>
    </InnerPageShell>
  );
}
