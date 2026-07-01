export default function MarketsLoading() {
  return (
    <div className="inner-page-shell" aria-busy="true" aria-label="Loading markets">
      <div className="inner-page-main">
        <div className="inner-page-content w-full max-w-md !py-5">
          <header className="pb-4">
            <div className="h-6 w-28 animate-pulse rounded-md bg-zinc-200/60 dark:bg-white/[0.08]" />
            <div className="mt-2 h-4 w-56 animate-pulse rounded-md bg-zinc-200/50 dark:bg-white/[0.06]" />
          </header>

          <section className="mb-5 rounded-xl border border-zinc-200/80 bg-surface/50 px-4 py-3.5 dark:border-white/[0.07] dark:bg-surface/40">
            <div className="h-3 w-24 animate-pulse rounded bg-cope-orange/20" />
            <div className="mt-2 h-4 w-full max-w-xs animate-pulse rounded-md bg-zinc-200/60 dark:bg-white/[0.08]" />
            <div className="mt-2 h-3 w-40 animate-pulse rounded-md bg-zinc-200/50 dark:bg-white/[0.06]" />
          </section>

          <section className="mb-6 rounded-xl border border-cope-orange/25 bg-surface/60 px-4 py-3.5 dark:border-cope-orange/20 dark:bg-surface/40">
            <div className="h-3 w-20 animate-pulse rounded bg-cope-orange/25" />
            <div className="mt-3 h-4 w-full animate-pulse rounded-md bg-zinc-200/60 dark:bg-white/[0.08]" />
            <div className="mt-2 h-3 w-3/4 animate-pulse rounded-md bg-zinc-200/50 dark:bg-white/[0.06]" />
          </section>

          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="animate-pulse rounded-xl border border-zinc-200/70 bg-surface/40 px-4 py-4 dark:border-white/[0.07] dark:bg-surface/35"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="h-4 w-full rounded-md bg-zinc-200/60 dark:bg-white/[0.08]" />
                    <div className="h-3 w-2/3 rounded-md bg-zinc-200/50 dark:bg-white/[0.06]" />
                  </div>
                  <div className="h-6 w-16 shrink-0 rounded-full bg-cope-orange/15" />
                </div>
                <div className="mt-4 h-2 w-full rounded-full bg-zinc-200/40 dark:bg-white/[0.05]" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
