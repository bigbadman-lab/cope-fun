import {
  formatSeasonDateRange,
  formatSeasonSnapshotLabel,
  getCurrentSeason,
  SEASON_OVERVIEW_COPY,
  SEASON_QUALIFICATION_COPY,
  SEASON_REWARDS_COPY,
  SEASON_SNAPSHOT_COPY,
  SEASON_WALLET_SIGNUP_COPY,
  type Season,
} from "@/lib/seasons";

type SeasonExplainerProps = {
  season?: Season;
  /** When embedded inside another container (e.g. a collapsible), drop the card chrome. */
  embedded?: boolean;
};

export function SeasonExplainer({
  season = getCurrentSeason(),
  embedded = false,
}: SeasonExplainerProps) {
  return (
    <section
      className={
        embedded
          ? "mb-4"
          : "mb-5 rounded-xl border border-zinc-200/80 bg-surface/50 px-4 py-4 dark:border-white/[0.07] dark:bg-surface/40"
      }
    >
      <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-cope-orange">
        {season.name}
      </p>
      <h2 className="mt-1 text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
        How this season works
      </h2>
      <p className="mt-2 text-[13px] leading-relaxed text-zinc-600 dark:text-zinc-400">
        {SEASON_OVERVIEW_COPY}
      </p>

      <dl className="mt-4 space-y-2.5 text-[13px] leading-relaxed text-zinc-600 dark:text-zinc-400">
        <div>
          <dt className="font-medium text-zinc-800 dark:text-zinc-200">Season dates</dt>
          <dd className="mt-0.5 tabular-nums">{formatSeasonDateRange(season)}</dd>
        </div>
        <div>
          <dt className="font-medium text-zinc-800 dark:text-zinc-200">
            Rewards snapshot
          </dt>
          <dd className="mt-0.5 tabular-nums">{formatSeasonSnapshotLabel(season)}</dd>
        </div>
      </dl>

      <ul className="mt-4 space-y-2 text-[13px] leading-relaxed text-zinc-600 dark:text-zinc-400">
        <li>{SEASON_QUALIFICATION_COPY}</li>
        <li>{SEASON_SNAPSHOT_COPY}</li>
        <li>{SEASON_REWARDS_COPY}</li>
        <li>{SEASON_WALLET_SIGNUP_COPY}</li>
      </ul>
    </section>
  );
}
