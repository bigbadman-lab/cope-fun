import { RoomPage } from "@/components/room-page";

type RoomProps = {
  params: Promise<{ slug: string }>;
};

export default async function Room({ params }: RoomProps) {
  const { slug } = await params;
  return <RoomPage slug={slug} />;
}
