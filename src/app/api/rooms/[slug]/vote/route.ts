import {
  getPublishedRoomIdBySlug,
  getRoomVoteStateForSession,
  upsertRoomVote,
} from "@/lib/db/votes";
import type { VoteChoice } from "@/lib/vote";
import {
  ANALYTICS_EVENTS,
  resolveAnonymousSessionIdFromToken,
  trackEvent,
} from "@/lib/db/analytics";
import { enforceRateLimit } from "@/lib/rate-limit/enforce";

type VoteRequest = {
  vote?: unknown;
  anonymousToken?: unknown;
};

function isVoteChoice(value: unknown): value is VoteChoice {
  return value === "believe" || value === "cope";
}

function getAnonymousToken(request: Request, body?: VoteRequest): string {
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

    const voteState = await getRoomVoteStateForSession(roomId, anonymousToken);

    return Response.json({ ok: true, ...voteState });
  } catch {
    return Response.json(
      { ok: false, error: "Could not load room vote." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const { slug } = await context.params;
    const body = (await request.json()) as VoteRequest;
    const anonymousToken = getAnonymousToken(request, body);
    const vote = body.vote;

    if (!anonymousToken) {
      return Response.json(
        { ok: false, error: "Anonymous session token is required." },
        { status: 400 },
      );
    }

    if (!isVoteChoice(vote)) {
      return Response.json(
        { ok: false, error: "Vote must be believe or cope." },
        { status: 400 },
      );
    }

    const rateLimited = await enforceRateLimit({
      request,
      action: "vote",
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

    const voteState = await upsertRoomVote({
      roomId,
      anonymousToken,
      vote,
    });

    trackEvent({
      eventName: ANALYTICS_EVENTS.voteCast,
      anonymousSessionId: await resolveAnonymousSessionIdFromToken(anonymousToken),
      roomId,
      metadata: { vote },
    });

    return Response.json({ ok: true, ...voteState });
  } catch {
    return Response.json(
      { ok: false, error: "Could not save room vote." },
      { status: 500 },
    );
  }
}
