import { getPublishedRoomIdBySlug } from "@/lib/db/votes";
import { getRoomMessageReactions } from "@/lib/db/reactions";
import { getOptionalAppUser } from "@/lib/auth/require-app-user";

type RouteContext = {
  params: Promise<{ slug: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  try {
    const { slug } = await context.params;

    const roomId = await getPublishedRoomIdBySlug(slug);
    if (!roomId) {
      return Response.json(
        { ok: false, error: "Room not found." },
        { status: 404 },
      );
    }

    const appUser = await getOptionalAppUser(request);
    const messages = await getRoomMessageReactions(roomId, appUser?.id ?? null);

    return Response.json({ ok: true, messages });
  } catch {
    return Response.json(
      { ok: false, error: "Could not load message reactions." },
      { status: 500 },
    );
  }
}
