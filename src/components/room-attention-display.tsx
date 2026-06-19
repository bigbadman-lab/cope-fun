import { MAX_ROOM_ATTENTION } from "@/lib/room-follow-up";

type AttentionMeterProps = {
  remaining: number;
  className?: string;
};

export function AttentionMeter({ remaining, className = "" }: AttentionMeterProps) {
  return (
    <div
      className={`flex gap-1 ${className}`}
      role="img"
      aria-label={`${remaining} of ${MAX_ROOM_ATTENTION} challenges remaining`}
    >
      {Array.from({ length: MAX_ROOM_ATTENTION }).map((_, index) => {
        const filled = index < remaining;
        return (
          <span
            key={index}
            className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
              filled ? "bg-[#fc8401]/85" : "bg-zinc-200 dark:bg-zinc-800"
            }`}
          />
        );
      })}
    </div>
  );
}

function RoomStatusChip({ concluded }: { concluded: boolean }) {
  return (
    <span
      className={`shrink-0 rounded-md px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.14em] ${
        concluded
          ? "bg-zinc-200/80 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
          : "bg-orange-500/10 text-orange-700 dark:bg-orange-500/15 dark:text-orange-400"
      }`}
    >
      {concluded ? "Concluded" : "Active debate"}
    </span>
  );
}

type RoomAttentionStripProps = {
  remaining: number;
  isCreator: boolean;
};

export function RoomAttentionStrip({
  remaining,
  isCreator,
}: RoomAttentionStripProps) {
  const concluded = remaining === 0;

  const headline = isCreator
    ? `You created this room · ${remaining} ${
        remaining === 1 ? "challenge" : "challenges"
      } remaining`
    : `Creator Attention · ${remaining} / ${MAX_ROOM_ATTENTION} challenges remaining`;

  const helper = isCreator
    ? concluded
      ? "You have used all available challenges."
      : "Challenge the debate. Each reply costs 1 Attention."
    : concluded
      ? "The creator has used all available challenges."
      : "The creator can challenge the agents until Attention runs out.";

  return (
    <div className="mt-3 border-t border-zinc-200/60 pt-3 dark:border-white/[0.06]">
      <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1.5">
        <p className="min-w-0 text-[12px] font-medium leading-snug text-zinc-800 dark:text-zinc-200">
          {headline}
        </p>
        <RoomStatusChip concluded={concluded} />
      </div>
      <AttentionMeter remaining={remaining} className="mt-2" />
      <p className="mt-2 text-[11px] leading-relaxed text-zinc-500 dark:text-zinc-500">
        {helper}
      </p>
    </div>
  );
}
