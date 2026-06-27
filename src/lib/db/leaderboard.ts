import "server-only";
import { formatAppUserLabel } from "@/lib/auth/display-label";
import { LEADERBOARD_MIN_MARKETS_ENTERED } from "@/lib/leaderboard/eligibility";
import { LEADERBOARD_RANK_ORDER } from "@/lib/leaderboard/ranking";
import { createSupabaseServiceClient } from "@/lib/supabase/server";
import type { LeaderboardEntry } from "@/lib/markets/types";

const LEADERBOARD_LIMIT = 50;

type LeaderboardRow = {
  user_id: string;
  balance_credits: number;
  season_points: number;
  total_won_credits: number;
  markets_entered: number;
  markets_won: number;
  markets_lost: number;
  app_users: {
    id: string;
    display_name: string | null;
    wallet_address: string | null;
    email: string | null;
  } | Array<{
    id: string;
    display_name: string | null;
    wallet_address: string | null;
    email: string | null;
  }>;
};

function normalizeSeasonPoints(value: number | null | undefined): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    return 0;
  }
  return Math.trunc(value);
}

export async function getLeaderboardEntries(): Promise<LeaderboardEntry[]> {
  const supabase = createSupabaseServiceClient();

  let query = supabase
    .from("cope_credit_accounts")
    .select(
      `
      user_id,
      balance_credits,
      season_points,
      total_won_credits,
      markets_entered,
      markets_won,
      markets_lost,
      app_users!inner (
        id,
        display_name,
        wallet_address,
        email
      )
    `,
    )
    .not("user_id", "is", null)
    .gte("markets_entered", LEADERBOARD_MIN_MARKETS_ENTERED);

  for (const { column, ascending } of LEADERBOARD_RANK_ORDER) {
    query = query.order(column, { ascending });
  }

  const { data, error } = await query.limit(LEADERBOARD_LIMIT);

  if (error || !data) {
    throw new Error("Could not load leaderboard.");
  }

  return (data as LeaderboardRow[]).map((row, index) => {
    const userRaw = row.app_users;
    const user = Array.isArray(userRaw) ? userRaw[0] : userRaw;

    return {
      rank: index + 1,
      userId: row.user_id,
      label: formatAppUserLabel({
        id: user.id,
        displayName: user.display_name,
        walletAddress: user.wallet_address,
        email: user.email,
      }),
      seasonPoints: normalizeSeasonPoints(row.season_points),
      balanceCredits: row.balance_credits,
      totalWonCredits: row.total_won_credits,
      marketsEntered: row.markets_entered,
      marketsWon: row.markets_won,
      marketsLost: row.markets_lost,
    };
  });
}
