export default function BeliefsLoading() {
  return (
    <div className="inner-page-shell" aria-busy="true" aria-label="Loading beliefs">
      <div className="inner-page-main">
        <div className="inner-page-content w-full max-w-md !py-5">
          <div className="pb-4 h-6 w-24 animate-pulse rounded-md bg-zinc-200/60 dark:bg-white/[0.08]" />

          <div className="mb-5 flex min-h-11 w-full items-center gap-3 rounded-xl border border-zinc-200/80 bg-zinc-900/[0.03] px-4 dark:border-white/10 dark:bg-white/[0.03]">
            <div className="size-[18px] shrink-0 animate-pulse rounded-full bg-zinc-200/50 dark:bg-white/[0.06]" />
            <div className="h-4 w-32 animate-pulse rounded-md bg-zinc-200/50 dark:bg-white/[0.06]" />
          </div>

          <div className="w-full">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="border-b border-zinc-200/60 py-3.5 last:border-b-0 dark:border-white/[0.06] sm:py-4"
              >
                <div className="flex animate-pulse items-start gap-3">
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="h-4 w-full rounded-md bg-zinc-200/60 dark:bg-white/[0.08]" />
                    <div className="h-3 w-4/5 rounded-md bg-zinc-200/50 dark:bg-white/[0.06]" />
                    <div className="h-3 w-1/2 rounded-md bg-zinc-200/40 dark:bg-white/[0.05]" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
