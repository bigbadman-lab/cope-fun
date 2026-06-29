import { MarketsPage } from "@/components/markets-page";
import type { PulseStatusResponse } from "@/components/pulse/use-pulse-room";
import { getPublicMarkets } from "@/lib/db/markets";
import { getBeliefRoomSummaryById } from "@/lib/db/rooms";
import { PULSE_BELIEF_ROOM_ID } from "@/lib/pulse/constants";
import { getPulsePublicStatus } from "@/lib/pulse/status";
import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata({
  title: "Markets",
  description:
    "Season conviction markets on Cope. Stake COPE Credits on Believe or Cope and compete on the leaderboard.",
  openGraphTitle: "Cope Markets",
  path: "/markets",
});

export default async function Markets() {
  const [{ open, closed, resolved, voided }, pulseRoom, pulseStatus] =
    await Promise.all([
      getPublicMarkets(),
      getBeliefRoomSummaryById(PULSE_BELIEF_ROOM_ID),
      getPulsePublicStatus(PULSE_BELIEF_ROOM_ID).catch(() => null),
    ]);

  const pulseMarket = pulseRoom
    ? {
        roomSlug: pulseRoom.slug,
        belief: pulseRoom.belief,
        initialStatus: pulseStatus
          ? ({ ok: true as const, ...pulseStatus } as PulseStatusResponse)
          : null,
      }
    : null;

  return (
    <MarketsPage
      open={open}
      closed={closed}
      resolved={resolved}
      voided={voided}
      pulseMarket={pulseMarket}
    />
  );
}
