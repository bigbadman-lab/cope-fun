"use client";

import {
  getVotePercentages,
  type VoteChoice,
} from "@/lib/vote";

type BelieveCopeVoteProps = {
  believeCount: number;
  copeCount: number;
  userVote: VoteChoice | null;
  onVote?: (choice: VoteChoice) => void;
};

export function BelieveCopeVote({
  believeCount,
  copeCount,
  userVote,
  onVote,
}: BelieveCopeVoteProps) {
  const readOnly = !onVote;
  const hasVoted = userVote !== null;
  const { believePct, copePct } = getVotePercentages(believeCount, copeCount);

  return (
    <div className="space-y-3 pt-1">
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        {hasVoted ? "your take" : "what do you think?"}
      </p>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onVote?.("believe")}
          disabled={readOnly}
          className={`min-h-11 rounded-full px-5 py-2.5 text-sm font-medium transition-all duration-200 md:min-h-0 md:py-2 ${
            userVote === "believe"
              ? "border border-emerald-600/50 bg-emerald-950/40 text-emerald-300 shadow-[0_0_12px_-4px_rgb(16_185_129/0.35)]"
              : "border border-emerald-900/40 bg-transparent text-emerald-400/80 hover:border-emerald-700/50 hover:bg-emerald-950/20 hover:text-emerald-300"
          } ${readOnly ? "cursor-default" : ""}`}
        >
          Believe
        </button>
        <button
          type="button"
          onClick={() => onVote?.("cope")}
          disabled={readOnly}
          className={`min-h-11 rounded-full px-5 py-2.5 text-sm font-medium transition-all duration-200 md:min-h-0 md:py-2 ${
            userVote === "cope"
              ? "border border-rose-600/50 bg-rose-950/40 text-rose-300 shadow-[0_0_12px_-4px_rgb(244_63_94/0.3)]"
              : "border border-rose-900/40 bg-transparent text-rose-400/80 hover:border-rose-700/50 hover:bg-rose-950/20 hover:text-rose-300"
          } ${readOnly ? "cursor-default" : ""}`}
        >
          Cope
        </button>
      </div>

      {hasVoted && (
        <div className="animate-vote-results-in space-y-2 pt-1">
          <div className="flex h-2 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800/80">
            <div
              className="bg-emerald-600/65 transition-[width] duration-700 ease-out"
              style={{ width: `${believePct}%` }}
            />
            <div
              className="bg-rose-500/55 transition-[width] duration-700 ease-out"
              style={{ width: `${copePct}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-emerald-400/85">Believe {believePct}%</span>
            <span className="text-rose-400/85">Cope {copePct}%</span>
          </div>
        </div>
      )}
    </div>
  );
}
