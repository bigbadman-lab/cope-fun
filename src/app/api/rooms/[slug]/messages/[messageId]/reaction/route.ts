import { getPublishedRoomIdBySlug } from "@/lib/db/votes";
import {
  isReactionType,
  resolveRoomMessageId,
  upsertMessageReaction,
} from "@/lib/db/reactions";
import {
  ANALYTICS_EVENTS,
  resolveAnonymousSessionIdFromToken,
  trackEvent,
} from "@/lib/db/analytics";
import { enforceRateLimit } from "@/lib/rate-limit/enforce";

type ReactionRequest = {
  reaction?: unknown;
  anonymousToken?: unknown;
};

function getAnonymousToken(body: ReactionRequest): string {
  return typeof body.anonymousToken === "string" ? body.anonymousToken.trim() : "";
}

type RouteContext = {
  params: Promise<{ slug: string; messageId: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  try {
    const { slug, messageId } = await context.params;
    const body = (await request.json()) as ReactionRequest;
    const anonymousToken = getAnonymousToken(body);
    const reaction = body.reaction;

    if (!anonymousToken) {
      return Response.json(
        { ok: false, error: "Anonymous session token is required." },
        { status: 400 },
      );
    }

    if (!isReactionType(reaction)) {
      return Response.json(
        { ok: false, error: "Reaction is invalid." },
        { status: 400 },
      );
    }

    const rateLimited = await enforceRateLimit({
      request,
      action: "reaction",
      anonymousToken,
    });
    if (rateLimited) return rateLimited;

    const roomId = await getPublishedRoomIdBySlug(slug);
    if (!roomId) {
      return Response.json(
        { ok: false, error: "Room not found." },
        { status: 404 },
      );
    }

    const dbMessageId = await resolveRoomMessageId(roomId, messageId);
    if (!dbMessageId) {
      return Response.json(
        { ok: false, error: "Message not found." },
        { status: 404 },
      );
    }

    const result = await upsertMessageReaction({
      roomId,
      dbMessageId,
      anonymousToken,
      reaction,
    });

    trackEvent({
      eventName: ANALYTICS_EVENTS.reactionAdded,
      anonymousSessionId: await resolveAnonymousSessionIdFromToken(anonymousToken),
      roomId,
      metadata: { reaction },
    });

    return Response.json({ ok: true, ...result });
  } catch {
    return Response.json(
      { ok: false, error: "Could not save message reaction." },
      { status: 500 },
    );
  }
}
