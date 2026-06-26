import {
  getCurrentSeason,
  getLeaderboardQualificationMessage,
} from "@/lib/seasons";

/** Minimum market entries required to appear on the season leaderboard. */
export const LEADERBOARD_MIN_MARKETS_ENTERED = 1;

export const LEADERBOARD_EMPTY_TITLE = "No market participants yet.";

export function getLeaderboardEmptySubtext(): string {
  return `Enter a belief market to join the ${getCurrentSeason().name} leaderboard.`;
}

export function getLeaderboardUnqualifiedHint(): string {
  return getLeaderboardQualificationMessage();
}

export function getLeaderboardProfileUnqualifiedMessage(): string {
  return getLeaderboardQualificationMessage();
}

export function isLeaderboardQualified(marketsEntered: number): boolean {
  return marketsEntered >= LEADERBOARD_MIN_MARKETS_ENTERED;
}
