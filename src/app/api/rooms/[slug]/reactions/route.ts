import {
  getPublishedRoomIdBySlug,
} from "@/lib/db/votes";
import { getRoomMessageReactions } from "@/lib/db/reactions";

type ReactionRequest = {
  reaction?: unknown;
  anonymousToken?: unknown;
};

function getAnonymousToken(request: Request, body?: ReactionRequest): string {
  if (body && typeof body.anonymousToken === "string") {
    return body.anonymousToken.trim();
  }

  const { searchParams } = new URL(request.url);
  return (searchParams.get("anonymousToken") ?? "").trim();
}

type RouteContext = {
  params: Promise<{ slug: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  try {
    const { slug } = await context.params;
    const anonymousToken = getAnonymousToken(request);

    if (!anonymousToken) {
      return Response.json(
        { ok: false, error: "Anonymous session token is required." },
        { status: 400 },
      );
    }

    const roomId = await getPublishedRoomIdBySlug(slug);
    if (!roomId) {
      return Response.json(
        { ok: false, error: "Room not found." },
        { status: 404 },
      );
    }

    const messages = await getRoomMessageReactions(roomId, anonymousToken);

    return Response.json({ ok: true, messages });
  } catch {
    return Response.json(
      { ok: false, error: "Could not load message reactions." },
      { status: 500 },
    );
  }
}
