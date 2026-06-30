import { CopeTokenPage } from "@/components/cope-token-page";
import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata({
  title: "$COPE",
  description:
    "$COPE is live on Solana. COPE Credits power Seasons 1–3 gameplay; the token supports rewards, Treasury Conviction, and the path to on-chain markets.",
  openGraphTitle: "$COPE — live on Solana",
  path: "/cope",
});

export default function CopePage() {
  return <CopeTokenPage />;
}
