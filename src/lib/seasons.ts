export type SeasonId = 1 | 2 | 3;

export type SeasonStatus = "upcoming" | "active" | "ended";

export type Season = {
  id: SeasonId;
  name: string;
  startAt: string;
  endAt: string;
  rewardsAt: string;
};

export const SEASONS: readonly Season[] = [
  {
    id: 1,
    name: "Season 1",
    startAt: "2026-06-30T00:00:00.000Z",
    endAt: "2026-07-31T23:59:59.000Z",
    rewardsAt: "2026-08-01T00:00:00.000Z",
  },
  {
    id: 2,
    name: "Season 2",
    startAt: "2026-08-01T00:00:00.000Z",
    endAt: "2026-08-31T23:59:59.000Z",
    rewardsAt: "2026-09-01T00:00:00.000Z",
  },
  {
    id: 3,
    name: "Season 3",
    startAt: "2026-09-01T00:00:00.000Z",
    endAt: "2026-09-30T23:59:59.000Z",
    rewardsAt: "2026-10-01T00:00:00.000Z",
  },
] as const;

export const SEASON_OVERVIEW_COPY =
  "Seasons are monthly competitions where users earn position on the leaderboard by participating in Season markets.";

export const SEASON_QUALIFICATION_COPY =
  "You enter the leaderboard after joining your first Season market.";

export const SEASON_SNAPSHOT_COPY =
  "At the end of each season, Cope takes a final leaderboard snapshot.";

export const SEASON_REWARDS_COPY =
  "Eligible rewards, if any, are reviewed after the season snapshot. Automatic $COPE payout is not live at MVP launch.";

export const SEASON_LEADERBOARD_RANKING_COPY =
  "Ranked by season points earned from winning settled markets during the active season.";

export const SEASON_LEADERBOARD_QUALIFICATION_COPY =
  "Enter at least one Season market during the active season to qualify.";

export const SEASON_POINTS_LABEL = "season points";

export const SEASON_WALLET_SIGNUP_COPY =
  "When you sign up, Cope creates or assigns a Solana rewards wallet for your account. This wallet is used for future $COPE rewards you qualify for. Automatic payout is not live at MVP launch. COPE Credits remain internal gameplay credits and are not $COPE.";

export const SEASON_WALLET_PROFILE_COPY =
  "This wallet is used for future $COPE rewards you qualify for. Automatic payout is not live at MVP launch. COPE Credits are internal and are not $COPE.";

export const REWARDS_WALLET_UNAVAILABLE_COPY =
  "Your rewards wallet is still being prepared. Sign out and back in, or connect a Solana wallet if this does not update.";

/** @deprecated Use SEASON_WALLET_SIGNUP_COPY — kept for import stability. */
export const REWARDS_WALLET_SIGNUP_COPY = SEASON_WALLET_SIGNUP_COPY;

/** @deprecated Use SEASON_WALLET_PROFILE_COPY — kept for import stability. */
export const REWARDS_WALLET_PROFILE_COPY = SEASON_WALLET_PROFILE_COPY;

export const SEASON_ELIGIBILITY_NOTE =
  "Season leaderboard standings may be used to determine eligibility for rewards you qualify for, if applicable. Exact criteria and allocations are not guaranteed.";

export const SEASON_FAQ_BULLETS = [
  "Join Season markets to compete during the active season.",
  "Climb the leaderboard with season points from winning settled markets.",
  "Cope takes a final snapshot when the season closes.",
  "Final $COPE rewards, if any, are reviewed after the snapshot — not auto-distributed at MVP launch.",
] as const;

export function getSeasonStatus(
  season: Season,
  now: number = Date.now(),
): SeasonStatus {
  const startMs = Date.parse(season.startAt);
  const endMs = Date.parse(season.endAt);

  if (now < startMs) return "upcoming";
  if (now > endMs) return "ended";
  return "active";
}

export function getCurrentSeason(now: number = Date.now()): Season {
  const active = SEASONS.find((season) => getSeasonStatus(season, now) === "active");
  if (active) return active;

  const upcoming = SEASONS.find(
    (season) => getSeasonStatus(season, now) === "upcoming",
  );
  if (upcoming) return upcoming;

  return SEASONS[SEASONS.length - 1];
}

export function getNextSeason(now: number = Date.now()): Season | null {
  const current = getCurrentSeason(now);
  const currentIndex = SEASONS.findIndex((season) => season.id === current.id);
  if (currentIndex === -1 || currentIndex >= SEASONS.length - 1) return null;
  return SEASONS[currentIndex + 1];
}

export function getSeasonById(id: SeasonId): Season | undefined {
  return SEASONS.find((season) => season.id === id);
}

export function getSeasonLeaderboardTitle(season: Season = getCurrentSeason()): string {
  return `${season.name} Leaderboard`;
}

export function getLeaderboardQualificationMessage(
  season: Season = getCurrentSeason(),
): string {
  return `Enter your first Season market to join ${season.name}.`;
}

export function formatSeasonDateUtc(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function formatSeasonDateTimeUtc(iso: string): string {
  const date = formatSeasonDateUtc(iso);
  const time = new Date(iso).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "UTC",
  });
  return `${date} at ${time} UTC`;
}

export function formatSeasonDateRange(season: Season): string {
  return `${formatSeasonDateUtc(season.startAt)} – ${formatSeasonDateUtc(season.endAt)} (UTC)`;
}

export function formatSeasonSnapshotLabel(season: Season): string {
  return `Final snapshot: ${formatSeasonDateTimeUtc(season.rewardsAt)}`;
}

export function formatWalletAddress(address: string): string {
  if (address.length <= 12) return address;
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

export function getCopeCreditsDisclaimer(
  season: Season = getCurrentSeason(),
): string {
  return `COPE Credits are gameplay credits for ${season.name}. They are not $COPE, not real money, not transferable, and not withdrawable.`;
}
