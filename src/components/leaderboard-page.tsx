import Link from "next/link";
import { InnerPageShell } from "./inner-page-shell";
import { LeaderboardQualificationHint } from "./leaderboard-qualification-hint";
import { SeasonExplainer } from "./season-explainer";
import {
  getLeaderboardEmptySubtext,
  LEADERBOARD_EMPTY_TITLE,
} from "@/lib/leaderboard/eligibility";
import {
  getCurrentSeason,
  getSeasonLeaderboardTitle,
  SEASON_ELIGIBILITY_NOTE,
  SEASON_LEADERBOARD_QUALIFICATION_COPY,
  SEASON_LEADERBOARD_RANKING_COPY,
  SEASON_REWARDS_COPY,
} from "@/lib/seasons";
import type { LeaderboardEntry } from "@/lib/markets/types";

type LeaderboardPageProps = {
  entries: LeaderboardEntry[];
};

function TopBadge({ rank }: { rank: number }) {
  if (rank > 3) return null;

  return (
    <span className="rounded-full border border-cope-orange/25 bg-cope-orange/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.1em] text-cope-orange">
      Top {rank}
    </span>
  );
}

function LeaderboardRow({ entry }: { entry: LeaderboardEntry }) {
  const initials = entry.label.replace("User ", "").slice(0, 2).toUpperCase();

  return (
    <div className="border-b border-zinc-200/60 last:border-b-0 dark:border-white/[0.06]">
      <div className="group -mx-2 flex items-start gap-3 rounded-xl px-2 py-3.5 sm:py-4">
        <div className="w-6 shrink-0 pt-1 text-center text-xs font-medium tabular-nums text-zinc-500">
          #{entry.rank}
        </div>
        <div className="flex size-9 shrink-0 items-center justify-center rounded-full border border-zinc-200/80 bg-surface text-xs font-semibold text-zinc-600 dark:border-white/[0.08] dark:bg-surface/70 dark:text-zinc-300">
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="min-w-0 text-[15px] font-medium leading-snug text-zinc-900 dark:text-zinc-100">
              {entry.label}
            </p>
            <TopBadge rank={entry.rank} />
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-500">
            <span>
              <span className="font-medium tabular-nums text-zinc-700 dark:text-zinc-300">
                {entry.seasonPoints.toLocaleString()}
              </span>{" "}
              season pts
            </span>
            <span>{entry.marketsEntered} entered</span>
            <span>
              {entry.marketsWon}W / {entry.marketsLost}L
            </span>
            {entry.totalWonCredits > 0 ? (
              <span className="text-zinc-400 dark:text-zinc-500">
                {entry.totalWonCredits.toLocaleString()} credits won (lifetime)
              </span>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

function RewardsNote({ seasonName }: { seasonName: string }) {
  return (
    <section className="mt-5 rounded-xl border border-zinc-200/80 bg-surface/50 px-4 py-4 dark:border-white/[0.07] dark:bg-surface/40">
      <h2 className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
        {seasonName} rewards
      </h2>
      <p className="mt-2 text-[13px] leading-relaxed text-zinc-600 dark:text-zinc-400">
        {SEASON_ELIGIBILITY_NOTE} {SEASON_REWARDS_COPY}
      </p>
    </section>
  );
}

export function LeaderboardPage({ entries }: LeaderboardPageProps) {
  const currentSeason = getCurrentSeason();

  return (
    <InnerPageShell topFade>
      <div className="inner-page-content w-full max-w-md !py-5">
        <header className="pb-4">
          <h1 className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            {getSeasonLeaderboardTitle(currentSeason)}
          </h1>
          <p className="mt-1.5 text-sm leading-relaxed text-zinc-500 dark:text-zinc-500">
            {SEASON_LEADERBOARD_RANKING_COPY} {SEASON_LEADERBOARD_QUALIFICATION_COPY}
          </p>
        </header>

        <SeasonExplainer season={currentSeason} />

        <LeaderboardQualificationHint />

        {entries.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-base font-medium text-zinc-600 dark:text-zinc-400">
              {LEADERBOARD_EMPTY_TITLE}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-zinc-500">
              {getLeaderboardEmptySubtext()}
            </p>
            <Link
              href="/markets"
              className="mt-4 inline-block text-sm font-medium text-cope-orange hover:underline"
            >
              View markets
            </Link>
          </div>
        ) : (
          <section className="w-full">
            {entries.map((entry) => (
              <LeaderboardRow key={entry.userId} entry={entry} />
            ))}
          </section>
        )}

        <RewardsNote seasonName={currentSeason.name} />
      </div>
    </InnerPageShell>
  );
}
