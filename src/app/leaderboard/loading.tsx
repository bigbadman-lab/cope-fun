export default function LeaderboardLoading() {
  return (
    <div className="inner-page-shell" aria-busy="true" aria-label="Loading leaderboard">
      <div className="inner-page-main">
        <div className="inner-page-content w-full max-w-md !py-5">
          <header className="pb-4">
            <div className="h-6 w-36 animate-pulse rounded-md bg-zinc-200/60 dark:bg-white/[0.08]" />
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <div className="h-4 w-48 animate-pulse rounded-md bg-zinc-200/50 dark:bg-white/[0.06]" />
              <div className="h-5 w-28 animate-pulse rounded-full border border-cope-orange/20 bg-cope-orange/10" />
            </div>
          </header>

          <section className="w-full">
            {Array.from({ length: 8 }).map((_, index) => (
              <div
                key={index}
                className="border-b border-zinc-200/60 last:border-b-0 dark:border-white/[0.06]"
              >
                <div className="flex animate-pulse items-start gap-3 px-2 py-3.5 sm:py-4">
                  <div className="w-6 shrink-0 pt-1">
                    <div className="mx-auto h-3 w-4 rounded bg-zinc-200/50 dark:bg-white/[0.06]" />
                  </div>
                  <div className="size-8 shrink-0 rounded-full bg-zinc-200/60 dark:bg-white/[0.08]" />
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="h-4 w-28 rounded-md bg-zinc-200/60 dark:bg-white/[0.08]" />
                    <div className="h-3 w-44 rounded-md bg-zinc-200/50 dark:bg-white/[0.06]" />
                  </div>
                </div>
              </div>
            ))}
          </section>
        </div>
      </div>
    </div>
  );
}
