import { LeaderboardPage } from "@/components/leaderboard-page";
import { getLeaderboardEntries } from "@/lib/db/leaderboard";

export default async function Leaderboard() {
  const entries = await getLeaderboardEntries();

  return <LeaderboardPage entries={entries} />;
}
