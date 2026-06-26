/** Minimum market entries required to appear on the Season 1 leaderboard. */
export const LEADERBOARD_MIN_MARKETS_ENTERED = 1;

export const LEADERBOARD_EMPTY_TITLE = "No market participants yet.";

export const LEADERBOARD_EMPTY_SUBTEXT =
  "Enter a belief market to join the Season 1 leaderboard.";

export const LEADERBOARD_UNQUALIFIED_HINT =
  "Enter your first belief market to join the leaderboard.";

export const LEADERBOARD_PROFILE_UNQUALIFIED_MESSAGE =
  "Enter your first belief market to join the Season 1 leaderboard.";

export function isLeaderboardQualified(marketsEntered: number): boolean {
  return marketsEntered >= LEADERBOARD_MIN_MARKETS_ENTERED;
}
