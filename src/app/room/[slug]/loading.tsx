export default function RoomLoading() {
  return (
    <div className="inner-page-shell-room" aria-busy="true" aria-label="Loading belief room">
      <div className="inner-page-main-room flex flex-col px-4">
        <div className="shrink-0 border-b border-zinc-200/60 pb-4 pt-2 dark:border-white/[0.06]">
          <div className="mx-auto w-full max-w-md animate-pulse space-y-3">
            <div className="h-3 w-20 rounded bg-cope-orange/20" />
            <div className="h-6 w-full rounded-md bg-zinc-200/60 dark:bg-white/[0.08]" />
            <div className="h-6 w-4/5 rounded-md bg-zinc-200/55 dark:bg-white/[0.07]" />
            <div className="flex gap-2 pt-1">
              <div className="h-8 w-24 rounded-full bg-zinc-200/50 dark:bg-white/[0.06]" />
              <div className="h-8 w-24 rounded-full bg-zinc-200/50 dark:bg-white/[0.06]" />
            </div>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-hidden">
          <div className="mx-auto flex h-full w-full max-w-md flex-col gap-4 py-4">
            {Array.from({ length: 5 }).map((_, index) => (
              <div
                key={index}
                className={`flex animate-pulse gap-3 ${index % 2 === 1 ? "flex-row-reverse" : ""}`}
              >
                <div className="size-9 shrink-0 rounded-full bg-zinc-200/60 dark:bg-white/[0.08]" />
                <div className="max-w-[78%] flex-1 space-y-2 rounded-2xl border border-zinc-200/60 bg-surface/40 px-3.5 py-3 dark:border-white/[0.06] dark:bg-surface/35">
                  <div className="h-3 w-16 rounded bg-cope-orange/15" />
                  <div className="h-3 w-full rounded-md bg-zinc-200/60 dark:bg-white/[0.08]" />
                  <div className="h-3 w-5/6 rounded-md bg-zinc-200/50 dark:bg-white/[0.06]" />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="shrink-0 border-t border-zinc-200/60 px-0 py-3 dark:border-white/[0.06]">
          <div className="mx-auto h-12 w-full max-w-md animate-pulse rounded-xl border border-zinc-200/70 bg-surface/40 dark:border-white/[0.07] dark:bg-surface/35" />
        </div>
      </div>
    </div>
  );
}
