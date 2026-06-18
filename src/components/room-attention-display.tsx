import { MAX_ROOM_ATTENTION } from "@/lib/room-follow-up";

type RoomAttentionDisplayProps = {
  remaining: number;
};

export function RoomAttentionDisplay({ remaining }: RoomAttentionDisplayProps) {
  return (
    <div className="rounded-xl border border-zinc-200/70 bg-surface/50 px-3.5 py-3 dark:border-white/[0.06] dark:bg-surface/40">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-zinc-500 dark:text-zinc-500">
          Attention Remaining
        </p>
        <span className="text-[11px] tabular-nums text-zinc-500 dark:text-zinc-500">
          {remaining} / {MAX_ROOM_ATTENTION}
        </span>
      </div>
      <div
        className="mt-2.5 flex gap-1"
        role="img"
        aria-label={`${remaining} of ${MAX_ROOM_ATTENTION} attention remaining`}
      >
        {Array.from({ length: MAX_ROOM_ATTENTION }).map((_, index) => {
          const filled = index < remaining;
          return (
            <span
              key={index}
              className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${
                filled
                  ? "bg-[#fc8401]/85"
                  : "bg-zinc-200 dark:bg-zinc-800"
              }`}
            />
          );
        })}
      </div>
    </div>
  );
}
