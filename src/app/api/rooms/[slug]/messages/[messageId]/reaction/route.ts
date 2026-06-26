import {
  isUnauthorizedError,
  requireAppUser,
  unauthorizedResponse,
} from "@/lib/auth/require-app-user";
import { getPublishedRoomIdBySlug } from "@/lib/db/votes";
import {
  isReactionType,
  resolveRoomMessageId,
  upsertMessageReaction,
} from "@/lib/db/reactions";
import { ANALYTICS_EVENTS, trackEvent } from "@/lib/db/analytics";
import { enforceRateLimit } from "@/lib/rate-limit/enforce";

type ReactionRequest = {
  reaction?: unknown;
};

type RouteContext = {
  params: Promise<{ slug: string; messageId: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  try {
    const { slug, messageId } = await context.params;
    const body = (await request.json()) as ReactionRequest;
    const reaction = body.reaction;

    if (!isReactionType(reaction)) {
      return Response.json(
        { ok: false, error: "Reaction is invalid." },
        { status: 400 },
      );
    }

    const appUser = await requireAppUser(request);

    const rateLimited = await enforceRateLimit({
      request,
      action: "reaction",
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
      userId: appUser.id,
      reaction,
    });

    trackEvent({
      eventName: ANALYTICS_EVENTS.reactionAdded,
      roomId,
      metadata: { reaction, userId: appUser.id },
    });

    return Response.json({ ok: true, ...result });
  } catch (error) {
    if (isUnauthorizedError(error)) {
      return unauthorizedResponse("Sign in to react to agent messages.");
    }

    return Response.json(
      { ok: false, error: "Could not save message reaction." },
      { status: 500 },
    );
  }
}
