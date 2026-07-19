import type { Metadata } from "next";
import { RoomPage } from "@/components/room-page";
import { ANALYTICS_EVENTS, trackEvent } from "@/lib/db/analytics";
import { getBeliefRoomBySlug } from "@/lib/db/rooms";
import { getRoomMarketBySlug } from "@/lib/db/markets";
import { PULSE_BELIEF_ROOM_ID } from "@/lib/pulse/constants";
import { getPulsePublicStatus } from "@/lib/pulse/status";
import type { PulseStatusResponse } from "@/components/pulse/use-pulse-room";
import {
  GENERIC_ROOM_TITLE,
  ROOM_DESCRIPTION,
  roomMetadataTitleSegment,
  roomPageTitle,
} from "@/lib/room-og/copy";

type RoomProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: RoomProps): Promise<Metadata> {
  const { slug } = await params;
  const room = await getBeliefRoomBySlug(slug);

  const title = room ? roomPageTitle(room.belief) : GENERIC_ROOM_TITLE;

  // The OG/Twitter image is produced by the colocated `opengraph-image.tsx`
  // file convention, which Next resolves to an absolute URL via metadataBase
  // and renders a branded fallback when the room cannot be loaded.
  return {
    title: room ? roomMetadataTitleSegment(room.belief) : "Belief Room",
    description: ROOM_DESCRIPTION,
    alternates: {
      canonical: `/room/${slug}`,
    },
    openGraph: {
      title,
      description: ROOM_DESCRIPTION,
      url: `/room/${slug}`,
      siteName: "Hoodswarm",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      site: "@HoodSwarmApp",
      title,
      description: ROOM_DESCRIPTION,
    },
  };
}

export default async function Room({ params }: RoomProps) {
  const { slug } = await params;
  const conversation = await getBeliefRoomBySlug(slug);
  const market = conversation ? await getRoomMarketBySlug(slug) : null;

  let initialPulseStatus: PulseStatusResponse | null = null;
  if (conversation && conversation.id === PULSE_BELIEF_ROOM_ID) {
    try {
      const status = await getPulsePublicStatus(conversation.id);
      initialPulseStatus = status ? { ok: true, ...status } : null;
    } catch {
      // Non-critical: client will fetch on mount if prefetch fails.
      initialPulseStatus = null;
    }
  }

  if (conversation) {
    trackEvent({
      eventName: ANALYTICS_EVENTS.roomViewed,
      roomId: conversation.id,
      metadata: { slug },
    });
  }

  return (
    <RoomPage
      slug={slug}
      initialConversation={conversation}
      initialMarket={market}
      initialPulseStatus={initialPulseStatus}
    />
  );
}
