export function RoomConclusionPanel() {
  return (
    <div className="rounded-2xl border border-zinc-200/80 bg-surface/60 px-4 py-4 text-center dark:border-white/[0.06] dark:bg-surface/50">
      <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
        The creator has used all 5 challenges.
      </p>
      <p className="mt-1.5 text-[12px] leading-relaxed text-zinc-500 dark:text-zinc-500">
        This belief record is now complete. It remains open for votes, reactions,
        and sharing.
      </p>
    </div>
  );
}
