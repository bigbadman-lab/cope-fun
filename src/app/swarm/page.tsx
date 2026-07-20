import { SwarmTokenPage } from "@/components/swarm-token-page";
import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata({
  title: "$SWARM",
  description:
    "$SWARM is live on Robinhood Chain. Swarm Credits power Seasons 1–3 gameplay on Hoodswarm — they are not $SWARM.",
  openGraphTitle: "$SWARM is live on Robinhood Chain",
  path: "/swarm",
});

export default function SwarmPage() {
  return <SwarmTokenPage />;
}
