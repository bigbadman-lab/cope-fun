/** Shared Season leaderboard ranking rules (MVP Season 1). */

export type LeaderboardRankRow = {
  user_id: string;
  season_points: number;
  total_won_credits: number;
  markets_won: number;
  markets_entered: number;
  updated_at: string;
  created_at: string;
};

/**
 * MVP Season 1: `cope_credit_accounts.season_points` is the active season score.
 * Multi-season history requires future season-scoped tables or snapshots.
 */
export const LEADERBOARD_RANK_ORDER = [
  { column: "season_points", ascending: false },
  { column: "markets_won", ascending: false },
  { column: "total_won_credits", ascending: false },
  { column: "updated_at", ascending: true },
  { column: "created_at", ascending: true },
] as const;

export function compareLeaderboardRankRows(
  a: LeaderboardRankRow,
  b: LeaderboardRankRow,
): number {
  if (b.season_points !== a.season_points) {
    return b.season_points - a.season_points;
  }
  if (b.markets_won !== a.markets_won) {
    return b.markets_won - a.markets_won;
  }
  if (b.total_won_credits !== a.total_won_credits) {
    return b.total_won_credits - a.total_won_credits;
  }

  const updatedDiff =
    Date.parse(a.updated_at) - Date.parse(b.updated_at);
  if (updatedDiff !== 0) return updatedDiff;

  return Date.parse(a.created_at) - Date.parse(b.created_at);
}

export function findLeaderboardRank(
  rows: LeaderboardRankRow[],
  userId: string,
): number | null {
  const index = rows.findIndex((row) => row.user_id === userId);
  return index >= 0 ? index + 1 : null;
}
