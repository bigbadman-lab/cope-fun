import { SwarmTokenPage } from "@/components/swarm-token-page";
import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata({
  title: "$SWARM",
  description:
    "$SWARM is the upcoming token for the Hoodswarm ecosystem on Robinhood Chain. Swarm Credits power Seasons 1–3 gameplay. Hoodswarm launches 20 July 2026.",
  openGraphTitle: "$SWARM — upcoming on Robinhood Chain",
  path: "/swarm",
});

export default function SwarmPage() {
  return <SwarmTokenPage />;
}
