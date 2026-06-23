import OpenAI from "openai";
import {
  BELIEF_VALIDATION_SYSTEM_PROMPT,
  buildBeliefValidationPrompt,
} from "./prompts";
import type {
  BeliefValidationReason,
  BeliefValidationResult,
} from "./types";

const MAX_BELIEF_LENGTH = 280;
const MIN_BELIEF_LENGTH = 8;
const VALID_MODEL_REASONS = new Set<BeliefValidationReason>([
  "ok",
  "not_belief",
  "too_vague",
  "unsafe",
  "spam",
]);

type ModelValidationPayload = {
  ok?: unknown;
  normalizedBelief?: unknown;
  reason?: unknown;
  issues?: unknown;
  message?: unknown;
  suggestedRewrite?: unknown;
  isDebatable?: unknown;
  isMarketReadyCandidate?: unknown;
  marketReadinessReason?: unknown;
};

type OpenAIErrorLike = {
  name?: unknown;
  message?: unknown;
  status?: unknown;
};

function shouldLogValidationDebug(): boolean {
  return process.env.NODE_ENV !== "production";
}

function logValidationConfig(model: string, apiKey: string | undefined) {
  if (!shouldLogValidationDebug()) return;

  console.info("[Cope Engine validation]", {
    openaiApiKeyPresent: Boolean(apiKey),
    model,
  });
}

function logValidationError(error: unknown) {
  if (!shouldLogValidationDebug()) return;

  const err = error as OpenAIErrorLike;
  console.error("[Cope Engine validation error]", {
    name: typeof err.name === "string" ? err.name : undefined,
    message: typeof err.message === "string" ? err.message : "Unknown error",
    status: typeof err.status === "number" ? err.status : undefined,
  });
}

function createResult(input: {
  ok: boolean;
  originalBelief: string;
  normalizedBelief?: string;
  reason: BeliefValidationReason;
  issues?: string[];
  message: string;
  suggestedRewrite?: string;
  isDebatable?: boolean;
  isMarketReadyCandidate?: boolean;
  marketReadinessReason?: string;
}): BeliefValidationResult {
  return {
    ok: input.ok,
    originalBelief: input.originalBelief,
    normalizedBelief: input.normalizedBelief ?? input.originalBelief.trim(),
    reason: input.reason,
    issues: input.issues ?? [],
    message: input.message,
    suggestedRewrite: input.suggestedRewrite,
    isDebatable: input.isDebatable ?? false,
    isMarketReadyCandidate: input.isMarketReadyCandidate ?? false,
    marketReadinessReason: input.marketReadinessReason,
  };
}

function errorResult(originalBelief: string): BeliefValidationResult {
  return createResult({
    ok: false,
    originalBelief,
    reason: "error",
    issues: ["Validation failed."],
    message: "The Cope Engine couldn’t test that input. Try again.",
  });
}

function deterministicSuccessResult(originalBelief: string): BeliefValidationResult {
  const normalizedBelief = originalBelief.trim();

  return createResult({
    ok: true,
    originalBelief,
    normalizedBelief,
    reason: "ok",
    message: "Belief accepted.",
    isDebatable: true,
    isMarketReadyCandidate: false,
    marketReadinessReason:
      "Market readiness requires model classification or manual review.",
  });
}

function hasLowInformationPattern(value: string): boolean {
  const compact = value.toLowerCase().replace(/\s+/g, "");
  const uniqueChars = new Set(compact).size;

  if (/(.)\1{6,}/i.test(compact)) return true;
  if (/^(asdf|asdfg|asdfgh|asdfghj|asdfghjk|asdfghjkl|qwerty)+$/i.test(compact)) {
    return true;
  }
  if (compact.length >= 8 && uniqueChars <= 3) return true;

  return false;
}

function runDeterministicChecks(originalBelief: string): BeliefValidationResult | null {
  const trimmed = originalBelief.trim();

  if (!trimmed) {
    return createResult({
      ok: false,
      originalBelief,
      normalizedBelief: "",
      reason: "empty",
      issues: ["Belief is empty."],
      message: "Give the Cope Engine a clearer belief to test.",
    });
  }

  if (trimmed.length < MIN_BELIEF_LENGTH) {
    return createResult({
      ok: false,
      originalBelief,
      reason: "too_short",
      issues: ["Belief is too short."],
      message: "Give the Cope Engine a clearer belief to test.",
    });
  }

  if (trimmed.length > MAX_BELIEF_LENGTH) {
    return createResult({
      ok: false,
      originalBelief,
      reason: "too_long",
      issues: ["Belief is too long."],
      message: "Keep your belief under 280 characters.",
    });
  }

  if (hasLowInformationPattern(trimmed)) {
    return createResult({
      ok: false,
      originalBelief,
      reason: "spam",
      issues: ["Input looks like spam."],
      message:
        "The Cope Engine can’t test that belief. Try a clearer claim, prediction, or conviction.",
    });
  }

  return null;
}

function stringOrUndefined(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function stringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

function parseModelPayload(raw: string): ModelValidationPayload {
  return JSON.parse(raw) as ModelValidationPayload;
}

function normalizeModelResult(
  originalBelief: string,
  payload: ModelValidationPayload,
): BeliefValidationResult {
  const rawReason = typeof payload.reason === "string" ? payload.reason : "error";
  const reason = VALID_MODEL_REASONS.has(rawReason as BeliefValidationReason)
    ? (rawReason as BeliefValidationReason)
    : "error";
  const ok = payload.ok === true && reason === "ok";
  const normalizedBelief =
    stringOrUndefined(payload.normalizedBelief) ?? originalBelief.trim();
  const message =
    stringOrUndefined(payload.message) ??
    (ok
      ? "Belief accepted."
      : "The Cope Engine can’t test that belief. Try a clearer claim, prediction, or conviction.");

  return createResult({
    ok,
    originalBelief,
    normalizedBelief,
    reason,
    issues: stringArray(payload.issues),
    message,
    suggestedRewrite: stringOrUndefined(payload.suggestedRewrite),
    isDebatable: payload.isDebatable === true && ok,
    isMarketReadyCandidate: payload.isMarketReadyCandidate === true && ok,
    marketReadinessReason: stringOrUndefined(payload.marketReadinessReason),
  });
}

async function classifyBeliefWithOpenAI(
  belief: string,
): Promise<BeliefValidationResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_VALIDATION_MODEL ?? "gpt-4o-mini";
  logValidationConfig(model, apiKey);

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured.");
  }

  const client = new OpenAI({ apiKey });
  const completion = await client.chat.completions.create({
    model,
    temperature: 0,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: BELIEF_VALIDATION_SYSTEM_PROMPT },
      { role: "user", content: buildBeliefValidationPrompt(belief) },
    ],
  });

  const content = completion.choices[0]?.message.content;
  if (!content) {
    throw new Error("OpenAI returned an empty validation response.");
  }

  return normalizeModelResult(belief, parseModelPayload(content));
}

export async function validateBelief(
  rawBelief: string,
): Promise<BeliefValidationResult> {
  const deterministicResult = runDeterministicChecks(rawBelief);
  if (deterministicResult) return deterministicResult;

  if (!process.env.OPENAI_API_KEY && process.env.NODE_ENV !== "production") {
    return deterministicSuccessResult(rawBelief);
  }

  try {
    return await classifyBeliefWithOpenAI(rawBelief.trim());
  } catch (error) {
    logValidationError(error);
    return errorResult(rawBelief);
  }
}
