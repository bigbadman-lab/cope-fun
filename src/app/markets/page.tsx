import { MarketsPage } from "@/components/markets-page";
import { getPublicMarkets } from "@/lib/db/markets";
import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata({
  title: "Markets",
  description:
    "Season conviction markets on Hoodswarm. Use Swarm Credits on Believe or Cope and compete on the leaderboard.",
  openGraphTitle: "Hoodswarm Markets",
  path: "/markets",
});

export const dynamic = "force-dynamic";

export default async function Markets() {
  const { open, closed, resolved, voided } = await getPublicMarkets();

  return (
    <MarketsPage
      open={open}
      closed={closed}
      resolved={resolved}
      voided={voided}
    />
  );
}
