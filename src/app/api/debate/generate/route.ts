import {
  generateOpeningDebate,
  validateBelief,
  type DebateGenerationResult,
} from "@/lib/cope-engine";
import {
  ANALYTICS_EVENTS,
  resolveAnonymousSessionIdFromToken,
  trackEvent,
} from "@/lib/db/analytics";
import { enforceRateLimit } from "@/lib/rate-limit/enforce";
import { getOptionalAnonymousToken } from "@/lib/rate-limit/request";

type GenerateDebateRequest = {
  belief?: unknown;
  validation?: unknown;
  anonymousToken?: unknown;
};

export async function POST(request: Request) {
  let belief = "";

  try {
    const body = (await request.json()) as GenerateDebateRequest;
    const anonymousToken = getOptionalAnonymousToken(body);
    const rateLimited = await enforceRateLimit({
      request,
      action: "debate_generate",
      anonymousToken,
    });
    if (rateLimited) return rateLimited;

    belief = typeof body.belief === "string" ? body.belief : "";

    const validation = await validateBelief(belief);
    if (!validation.ok) {
      return Response.json(
        {
          ok: false,
          error: "invalid_belief",
          message: validation.message,
        },
        { status: 400 },
      );
    }

    const validatedBelief = validation.normalizedBelief.trim() || belief.trim();
    const result = await generateOpeningDebate({
      belief: validatedBelief,
      validation,
    });

    trackEvent({
      eventName: ANALYTICS_EVENTS.debateGenerated,
      anonymousSessionId: await resolveAnonymousSessionIdFromToken(anonymousToken),
      metadata: {
        ok: result.ok,
        messageCount: result.messages.length,
      },
    });

    return Response.json(result);
  } catch {
    const result: DebateGenerationResult = {
      ok: false,
      belief: belief.trim(),
      messages: [],
      agents: [],
      error: "Could not generate debate.",
    };

    return Response.json(result);
  }
}
