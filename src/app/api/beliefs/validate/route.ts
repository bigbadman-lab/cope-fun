import {
  validateBelief,
  type BeliefValidationResult,
} from "@/lib/cope-engine";
import {
  ANALYTICS_EVENTS,
  resolveAnonymousSessionIdFromToken,
  trackEvent,
} from "@/lib/db/analytics";
import { enforceRateLimit } from "@/lib/rate-limit/enforce";
import { getOptionalAnonymousToken } from "@/lib/rate-limit/request";

type ValidateBeliefRequest = {
  belief?: unknown;
  anonymousToken?: unknown;
};

export async function POST(request: Request) {
  let originalBelief = "";

  try {
    const body = (await request.json()) as ValidateBeliefRequest;
    const anonymousToken = getOptionalAnonymousToken(body);
    const rateLimited = await enforceRateLimit({
      request,
      action: "belief_validate",
      anonymousToken,
    });
    if (rateLimited) return rateLimited;

    originalBelief = typeof body.belief === "string" ? body.belief : "";
    const result = await validateBelief(originalBelief);

    trackEvent({
      eventName: ANALYTICS_EVENTS.beliefValidated,
      anonymousSessionId: await resolveAnonymousSessionIdFromToken(anonymousToken),
      metadata: { valid: result.ok },
    });

    return Response.json(result);
  } catch {
    const result: BeliefValidationResult = {
      ok: false,
      originalBelief,
      normalizedBelief: originalBelief.trim(),
      reason: "error",
      issues: ["Validation failed."],
      message: "The Cope Engine couldn’t test that input. Try again.",
      isDebatable: false,
      isMarketReadyCandidate: false,
    };

    return Response.json(result);
  }
}
