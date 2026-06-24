import "server-only";
import { createSupabaseServiceClient } from "@/lib/supabase/server";
import { getOrCreateAnonymousSession } from "./anonymous-session";

export type RoomCreatorStatus = {
  isCreator: boolean;
};

export async function getRoomCreatorStatus(
  slug: string,
  anonymousToken: string,
): Promise<RoomCreatorStatus> {
  const session = await getOrCreateAnonymousSession(anonymousToken);
  const supabase = createSupabaseServiceClient();
  const { data: room, error } = await supabase
    .from("belief_rooms")
    .select("creator_anonymous_session_id")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (error || !room) {
    return { isCreator: false };
  }

  return {
    isCreator: room.creator_anonymous_session_id === session.id,
  };
}
