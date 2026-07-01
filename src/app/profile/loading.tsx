export default function ProfileLoading() {
  return (
    <div className="inner-page-shell" aria-busy="true" aria-label="Loading profile">
      <div className="inner-page-main">
        <div className="inner-page-content w-full max-w-md !py-5">
          <header className="pb-4">
            <div className="h-6 w-24 animate-pulse rounded-md bg-zinc-200/60 dark:bg-white/[0.08]" />
            <div className="mt-2 h-4 w-52 animate-pulse rounded-md bg-zinc-200/50 dark:bg-white/[0.06]" />
          </header>

          <div className="animate-pulse rounded-xl border border-zinc-200/70 bg-surface/40 px-4 py-4 dark:border-white/[0.07] dark:bg-surface/35">
            <div className="flex items-center gap-3">
              <div className="size-14 rounded-full bg-zinc-200/60 dark:bg-white/[0.08]" />
              <div className="min-w-0 flex-1 space-y-2">
                <div className="h-4 w-32 rounded-md bg-zinc-200/60 dark:bg-white/[0.08]" />
                <div className="h-3 w-44 rounded-md bg-zinc-200/50 dark:bg-white/[0.06]" />
              </div>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="h-16 animate-pulse rounded-xl border border-zinc-200/70 bg-surface/40 dark:border-white/[0.07] dark:bg-surface/35"
              />
            ))}
          </div>

          <div className="mt-4 h-36 animate-pulse rounded-xl border border-zinc-200/70 bg-surface/40 dark:border-white/[0.07] dark:bg-surface/35" />
          <div className="mt-4 h-28 animate-pulse rounded-xl border border-zinc-200/70 bg-surface/40 dark:border-white/[0.07] dark:bg-surface/35" />
        </div>
      </div>
    </div>
  );
}
