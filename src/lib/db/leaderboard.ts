import "server-only";
import { createSupabaseServiceClient } from "@/lib/supabase/server";
import type { LeaderboardEntry } from "@/lib/markets/types";

const LEADERBOARD_LIMIT = 50;

function anonymousLabel(sessionId: string): string {
  return `User ${sessionId.slice(0, 8)}`;
}

export async function getLeaderboardEntries(): Promise<LeaderboardEntry[]> {
  const supabase = createSupabaseServiceClient();
  const { data, error } = await supabase
    .from("cope_credit_accounts")
    .select(
      "anonymous_session_id, balance_credits, total_won_credits, markets_entered, markets_won, markets_lost",
    )
    .order("total_won_credits", { ascending: false })
    .order("markets_won", { ascending: false })
    .limit(LEADERBOARD_LIMIT);

  if (error || !data) {
    throw new Error("Could not load leaderboard.");
  }

  return data.map((row, index) => ({
    rank: index + 1,
    anonymousSessionId: row.anonymous_session_id,
    label: anonymousLabel(row.anonymous_session_id),
    balanceCredits: row.balance_credits,
    totalWonCredits: row.total_won_credits,
    marketsEntered: row.markets_entered,
    marketsWon: row.markets_won,
    marketsLost: row.markets_lost,
  }));
}
