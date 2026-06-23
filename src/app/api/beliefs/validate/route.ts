import {
  validateBelief,
  type BeliefValidationResult,
} from "@/lib/cope-engine";

type ValidateBeliefRequest = {
  belief?: unknown;
};

export async function POST(request: Request) {
  let originalBelief = "";

  try {
    const body = (await request.json()) as ValidateBeliefRequest;
    originalBelief = typeof body.belief === "string" ? body.belief : "";
    const result = await validateBelief(originalBelief);

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
