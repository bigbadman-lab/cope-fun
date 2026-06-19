import { RoomAttentionStrip } from "./room-attention-display";

function PinIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M12 16V4" />
      <path d="M8 8h8" />
      <path d="M9.5 16h5" />
      <path d="M12 16v3.5" />
    </svg>
  );
}

type PinnedBeliefProps = {
  text: string;
  attentionRemaining?: number;
  isCreator?: boolean;
};

export function PinnedBelief({
  text,
  attentionRemaining,
  isCreator,
}: PinnedBeliefProps) {
  const showAttention =
    typeof attentionRemaining === "number" && typeof isCreator === "boolean";

  return (
    <div className="bg-background pb-3 pt-0.5">
      <div className="rounded-xl border border-zinc-200/70 bg-background px-3.5 py-3.5 dark:border-white/[0.07]">
        <div className="flex items-center gap-1.5">
          <PinIcon className="size-3 shrink-0 text-zinc-400 dark:text-zinc-500" />
          <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-zinc-500 dark:text-zinc-500">
            Pinned belief
          </p>
        </div>
        <p className="mt-2.5 whitespace-pre-line text-[15px] font-medium leading-relaxed tracking-[-0.01em] text-zinc-900 dark:text-zinc-50 sm:text-base">
          {text}
        </p>
        <p className="mt-2 text-[11px] leading-relaxed text-zinc-500 dark:text-zinc-500">
          Being stress-tested by the Cope Engine
        </p>

        {showAttention && (
          <RoomAttentionStrip
            remaining={attentionRemaining}
            isCreator={isCreator}
          />
        )}
      </div>
    </div>
  );
}
