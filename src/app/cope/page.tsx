import { CopeTokenPage } from "@/components/cope-token-page";
import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata({
  title: "$COPE",
  description:
    "The protocol token behind Cope. COPE Credits power Seasons 1–3 gameplay; $COPE supports rewards, Treasury Conviction, and the path to on-chain markets.",
  openGraphTitle: "$COPE — the conviction network token",
  path: "/cope",
});

export default function CopePage() {
  return <CopeTokenPage />;
}
