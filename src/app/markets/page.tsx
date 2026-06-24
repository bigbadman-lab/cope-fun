import { MarketsPage } from "@/components/markets-page";
import { getPublicMarkets } from "@/lib/db/markets";

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
