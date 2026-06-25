import { HomePage } from "@/components/home-page";
import { getRecentPublishedBeliefs } from "@/lib/db/room-search";

const RECENT_BELIEFS_LIMIT = 3;

export default async function Home() {
  let initialRecentBeliefs: Awaited<
    ReturnType<typeof getRecentPublishedBeliefs>
  > = [];

  try {
    initialRecentBeliefs = await getRecentPublishedBeliefs(RECENT_BELIEFS_LIMIT);
  } catch {
    initialRecentBeliefs = [];
  }

  return <HomePage initialRecentBeliefs={initialRecentBeliefs} />;
}
