import { ImageResponse } from "next/og";
import { getBeliefRoomBySlug } from "@/lib/db/rooms";
import { buildRoomOgImageElement } from "@/lib/room-og/og-image";
import { selectOgQuote } from "@/lib/room-og/quote";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export const runtime = "nodejs";

type OgImageProps = {
  params: Promise<{ slug: string }>;
};

export default async function Image({ params }: OgImageProps) {
  const { slug } = await params;

  let belief: string | undefined;
  let quote = null;

  // Public crawlers hit this without auth; never throw — fall back to the
  // branded generic image if the room can't be loaded.
  try {
    const room = await getBeliefRoomBySlug(slug);
    belief = room?.belief;
    quote = room ? selectOgQuote(room.messages) : null;
  } catch {
    belief = undefined;
    quote = null;
  }

  return new ImageResponse(
    buildRoomOgImageElement({
      belief,
      quote,
    }),
    {
      ...size,
    },
  );
}
