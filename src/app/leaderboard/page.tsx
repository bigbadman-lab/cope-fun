import { LeaderboardPage } from "@/components/leaderboard-page";
import { getLeaderboardEntries } from "@/lib/db/leaderboard";
import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata({
  title: "Leaderboard",
  description:
    "Compete in the active Cope season by entering markets, earning season points, and climbing the leaderboard.",
  openGraphTitle: "Cope Leaderboard",
  path: "/leaderboard",
});

export default async function Leaderboard() {
  const entries = await getLeaderboardEntries();

  return <LeaderboardPage entries={entries} />;
}
