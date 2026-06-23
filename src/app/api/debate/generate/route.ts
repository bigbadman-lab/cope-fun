import {
  generateOpeningDebate,
  type BeliefValidationResult,
  type DebateGenerationResult,
} from "@/lib/cope-engine";

type GenerateDebateRequest = {
  belief?: unknown;
  validation?: unknown;
};

function isValidationResult(value: unknown): value is BeliefValidationResult {
  return (
    typeof value === "object" &&
    value !== null &&
    "ok" in value &&
    "normalizedBelief" in value
  );
}

export async function POST(request: Request) {
  let belief = "";

  try {
    const body = (await request.json()) as GenerateDebateRequest;
    belief = typeof body.belief === "string" ? body.belief : "";
    const validation = isValidationResult(body.validation)
      ? body.validation
      : undefined;

    const result = await generateOpeningDebate({ belief, validation });

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
