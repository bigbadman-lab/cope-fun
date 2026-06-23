import { RoomPage } from "@/components/room-page";
import { getBeliefRoomBySlug } from "@/lib/db/rooms";

type RoomProps = {
  params: Promise<{ slug: string }>;
};

export default async function Room({ params }: RoomProps) {
  const { slug } = await params;
  const conversation = await getBeliefRoomBySlug(slug);
  return <RoomPage slug={slug} initialConversation={conversation} />;
}
