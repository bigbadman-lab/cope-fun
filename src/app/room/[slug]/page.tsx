import type { Metadata } from "next";
import { RoomPage } from "@/components/room-page";
import { ANALYTICS_EVENTS, trackEvent } from "@/lib/db/analytics";
import { getBeliefRoomBySlug } from "@/lib/db/rooms";
import {
  GENERIC_ROOM_TITLE,
  ROOM_DESCRIPTION,
  roomMetadataTitleSegment,
  roomOgImageAlt,
  roomOgImagePath,
  roomPageTitle,
} from "@/lib/room-og/copy";

type RoomProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: RoomProps): Promise<Metadata> {
  const { slug } = await params;
  const room = await getBeliefRoomBySlug(slug);

  const title = room ? roomPageTitle(room.belief) : GENERIC_ROOM_TITLE;
  const ogImagePath = roomOgImagePath(slug);
  const ogImageAlt = roomOgImageAlt(room?.belief ?? null);

  return {
    title: room ? roomMetadataTitleSegment(room.belief) : "Belief Room",
    description: ROOM_DESCRIPTION,
    openGraph: {
      title,
      description: ROOM_DESCRIPTION,
      url: `/room/${slug}`,
      type: "website",
      images: [
        {
          url: ogImagePath,
          width: 1200,
          height: 630,
          alt: ogImageAlt,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: ROOM_DESCRIPTION,
      images: [ogImagePath],
    },
  };
}

export default async function Room({ params }: RoomProps) {
  const { slug } = await params;
  const conversation = await getBeliefRoomBySlug(slug);

  if (conversation) {
    trackEvent({
      eventName: ANALYTICS_EVENTS.roomViewed,
      roomId: conversation.id,
      metadata: { slug },
    });
  }

  return <RoomPage slug={slug} initialConversation={conversation} />;
}
