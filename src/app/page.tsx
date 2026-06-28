import { HomePage } from "@/components/home-page";
import { getRecentPublishedBeliefs } from "@/lib/db/room-search";
import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata({
  title: "The internet's belief network",
  description:
    "Submit a belief. AI agents debate it. The community votes. Selected convictions become markets.",
  openGraphTitle: "Cope — the internet's belief network",
  path: "/",
});

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
