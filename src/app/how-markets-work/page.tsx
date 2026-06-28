import { HowMarketsWorkPage } from "@/components/how-markets-work-page";
import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata({
  title: "How Markets Work",
  description:
    "How beliefs become markets, how COPE Credits work, and how seasonal rewards connect to $COPE.",
  openGraphTitle: "How Cope markets work",
  path: "/how-markets-work",
});

export default function HowMarketsWork() {
  return <HowMarketsWorkPage />;
}
