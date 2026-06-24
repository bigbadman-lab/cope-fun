import {
  RoomChallengeError,
  submitRoomChallenge,
} from "@/lib/db/challenges";
import { enforceRateLimit } from "@/lib/rate-limit/enforce";

type ChallengeRequest = {
  anonymousToken?: unknown;
  challengeText?: unknown;
  clientChallengeId?: unknown;
};

type RouteContext = {
  params: Promise<{ slug: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  try {
    const { slug } = await context.params;
    const body = (await request.json()) as ChallengeRequest;
    const anonymousToken =
      typeof body.anonymousToken === "string" ? body.anonymousToken.trim() : "";
    const challengeText =
      typeof body.challengeText === "string" ? body.challengeText : "";
    const clientChallengeId =
      typeof body.clientChallengeId === "string"
        ? body.clientChallengeId.trim()
        : undefined;

    if (!anonymousToken) {
      return Response.json(
        { ok: false, error: "Anonymous session token is required." },
        { status: 400 },
      );
    }

    const rateLimited = await enforceRateLimit({
      request,
      action: "room_challenge",
      anonymousToken,
    });
    if (rateLimited) return rateLimited;

    const result = await submitRoomChallenge({
      slug,
      anonymousToken,
      challengeText,
      clientChallengeId,
    });

    return Response.json({
      ok: true,
      room: result.room,
      agentReplies: result.agentReplies,
      agents: result.agents,
      attentionRemaining: result.attentionRemaining,
      challengeCount: result.challengeCount,
    });
  } catch (error) {
    if (error instanceof RoomChallengeError) {
      return Response.json(
        { ok: false, error: error.message },
        { status: error.status },
      );
    }

    return Response.json(
      { ok: false, error: "Could not submit challenge." },
      { status: 500 },
    );
  }
}
