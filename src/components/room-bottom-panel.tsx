export function RoomVisitorPanel() {
  return (
    <div className="rounded-2xl border border-zinc-200/80 bg-surface/60 px-4 py-4 dark:border-white/[0.06] dark:bg-surface/50">
      <p className="text-sm font-medium tracking-tight text-zinc-900 dark:text-zinc-100">
        This is not a chat room
      </p>
      <p className="mt-2 text-[13px] leading-relaxed text-zinc-600 dark:text-zinc-400">
        Only the belief creator can spend Attention to challenge the agents.
        Everyone else can read the debate, vote Believe or Cope, react, and share
        the room.
      </p>
      <p className="mt-3 text-[11px] leading-relaxed text-zinc-500 dark:text-zinc-500">
        A room is a record of one conviction being tested.
      </p>
    </div>
  );
}

export function RoomConclusionPanel() {
  return (
    <div className="rounded-2xl border border-zinc-200/80 bg-surface/60 px-4 py-4 text-center dark:border-white/[0.06] dark:bg-surface/50">
      <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
        This belief has reached its conclusion.
      </p>
      <p className="mt-1.5 text-[12px] leading-relaxed text-zinc-500 dark:text-zinc-500">
        The record stays open for votes, reactions, and sharing.
      </p>
    </div>
  );
}
