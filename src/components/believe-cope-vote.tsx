"use client";

import { getVotePercentages, type VoteChoice } from "@/lib/vote";

type BelieveCopeVoteProps = {
  believeCount: number;
  copeCount: number;
  userVote: VoteChoice | null;
  onVote?: (choice: VoteChoice) => void;
  variant?: "default" | "room";
};

function VoteMeter({
  believePct,
  copePct,
  muted,
}: {
  believePct: number;
  copePct: number;
  muted?: boolean;
}) {
  return (
    <div
      className={`flex h-1.5 overflow-hidden rounded-full bg-zinc-200 transition-opacity duration-300 dark:bg-zinc-800/80 ${
        muted ? "opacity-45" : "opacity-100"
      }`}
    >
      <div
        className="bg-emerald-600/70 transition-[width] duration-700 ease-out dark:bg-emerald-600/60"
        style={{ width: `${believePct}%` }}
      />
      <div
        className="bg-rose-500/65 transition-[width] duration-700 ease-out dark:bg-rose-500/50"
        style={{ width: `${copePct}%` }}
      />
    </div>
  );
}

function VoteSegment({
  choice,
  label,
  userVote,
  readOnly,
  onVote,
}: {
  choice: VoteChoice;
  label: string;
  userVote: VoteChoice | null;
  readOnly: boolean;
  onVote?: (choice: VoteChoice) => void;
}) {
  const selected = userVote === choice;
  const otherSelected = userVote != null && userVote !== choice;
  const isBelieve = choice === "believe";

  const selectedClass = isBelieve
    ? "bg-emerald-600 text-white shadow-[0_1px_2px_rgb(5_150_105/0.25)] dark:bg-emerald-600/90 dark:shadow-[0_1px_8px_-2px_rgb(16_185_129/0.35)]"
    : "bg-rose-600 text-white shadow-[0_1px_2px_rgb(225_29_72/0.2)] dark:bg-rose-600/90 dark:shadow-[0_1px_8px_-2px_rgb(244_63_94/0.3)]";

  const idleClass = isBelieve
    ? "text-emerald-800 hover:bg-emerald-50 active:bg-emerald-100/80 dark:text-emerald-400/90 dark:hover:bg-emerald-950/35 dark:active:bg-emerald-950/50"
    : "text-rose-800 hover:bg-rose-50 active:bg-rose-100/80 dark:text-rose-400/90 dark:hover:bg-rose-950/35 dark:active:bg-rose-950/50";

  return (
    <button
      type="button"
      onClick={() => onVote?.(choice)}
      disabled={readOnly}
      aria-pressed={selected}
      className={`min-h-11 flex-1 rounded-[10px] px-3 py-2.5 text-sm font-medium transition-all duration-200 md:min-h-0 md:py-2 ${
        selected ? selectedClass : otherSelected ? "text-zinc-400 dark:text-zinc-600" : idleClass
      } ${readOnly ? "cursor-default" : ""}`}
    >
      {label}
    </button>
  );
}

function VoteControls({
  believeCount,
  copeCount,
  userVote,
  onVote,
  variant,
}: {
  believeCount: number;
  copeCount: number;
  userVote: VoteChoice | null;
  onVote?: (choice: VoteChoice) => void;
  variant: "default" | "room";
}) {
  const readOnly = !onVote;
  const hasVoted = userVote !== null;
  const { believePct, copePct } = getVotePercentages(believeCount, copeCount);
  const totalTakes = believeCount + copeCount;
  const showMeter = variant === "room" || hasVoted;
  const meterMuted = variant === "room" && !hasVoted;

  return (
    <>
      {variant === "default" && (
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          {hasVoted ? "Your take" : "What do you think?"}
        </p>
      )}

      {showMeter && (
        <div className="space-y-2">
          <div className="flex items-baseline justify-between gap-3 text-xs tabular-nums">
            <span
              className={`font-medium transition-colors duration-300 ${
                userVote === "believe"
                  ? "text-emerald-700 dark:text-emerald-400"
                  : "text-emerald-700/75 dark:text-emerald-400/75"
              }`}
            >
              Believe {believePct}%
            </span>
            {variant === "room" && (
              <span className="text-[11px] text-zinc-500 dark:text-zinc-500">
                {totalTakes.toLocaleString()} takes
              </span>
            )}
            <span
              className={`font-medium transition-colors duration-300 ${
                userVote === "cope"
                  ? "text-rose-700 dark:text-rose-400"
                  : "text-rose-700/75 dark:text-rose-400/75"
              }`}
            >
              Cope {copePct}%
            </span>
          </div>
          <VoteMeter
            believePct={believePct}
            copePct={copePct}
            muted={meterMuted}
          />
        </div>
      )}

      <div className="grid grid-cols-2 gap-1 rounded-xl border border-zinc-200/80 bg-zinc-50/90 p-1 dark:border-white/[0.06] dark:bg-surface">
        <VoteSegment
          choice="believe"
          label="Believe"
          userVote={userVote}
          readOnly={readOnly}
          onVote={onVote}
        />
        <VoteSegment
          choice="cope"
          label="Cope"
          userVote={userVote}
          readOnly={readOnly}
          onVote={onVote}
        />
      </div>

      {variant === "room" && !hasVoted && (
        <p className="mt-2.5 text-center text-[11px] leading-relaxed text-zinc-500 dark:text-zinc-500">
          Pick a side — your vote joins the room tally.
        </p>
      )}
    </>
  );
}

export function BelieveCopeVote({
  believeCount,
  copeCount,
  userVote,
  onVote,
  variant = "default",
}: BelieveCopeVoteProps) {
  const hasVoted = userVote !== null;

  if (variant === "room") {
    return (
      <section className="border-t border-zinc-200/80 pt-5 dark:border-white/5">
        <p className="mb-3 text-[11px] font-medium uppercase tracking-[0.14em] text-zinc-500 dark:text-zinc-500">
          {hasVoted ? "Your take" : "Where do you stand?"}
        </p>
        <div className="space-y-3 rounded-2xl border border-zinc-200/70 bg-surface/60 px-3.5 py-3.5 dark:border-white/[0.06] dark:bg-surface/80">
          <VoteControls
            believeCount={believeCount}
            copeCount={copeCount}
            userVote={userVote}
            onVote={onVote}
            variant={variant}
          />
        </div>
      </section>
    );
  }

  return (
    <div className="space-y-3 pt-1">
      <VoteControls
        believeCount={believeCount}
        copeCount={copeCount}
        userVote={userVote}
        onVote={onVote}
        variant={variant}
      />
    </div>
  );
}
