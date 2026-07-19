import { HowMarketsWorkPage } from "@/components/how-markets-work-page";
import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata({
  title: "How Markets Work",
  description:
    "How beliefs become markets, how Swarm Credits work, and how seasonal rewards connect to $SWARM.",
  openGraphTitle: "How Hoodswarm markets work",
  path: "/how-markets-work",
});

export default function HowMarketsWork() {
  return <HowMarketsWorkPage />;
}
