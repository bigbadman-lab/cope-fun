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
  const room = await getBeliefRoomBySlug(slug);
  const quote = room ? selectOgQuote(room.messages) : null;

  return new ImageResponse(
    buildRoomOgImageElement({
      belief: room?.belief,
      quote,
    }),
    {
      ...size,
    },
  );
}
