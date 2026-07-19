import { LeaderboardPage } from "@/components/leaderboard-page";
import { getLeaderboardEntries } from "@/lib/db/leaderboard";
import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata({
  title: "Leaderboard",
  description:
    "Compete in the active Hoodswarm season by entering markets, earning season points, and climbing the leaderboard.",
  openGraphTitle: "Hoodswarm Leaderboard",
  path: "/leaderboard",
});

export const revalidate = 60;

export default async function Leaderboard() {
  const entries = await getLeaderboardEntries();

  return <LeaderboardPage entries={entries} />;
}
