import OpenAI from "openai";
import type { ChatMessage } from "@/components/debate-chat";
import { AGENT_PROFILES, type AgentSlug } from "@/lib/agent-profiles";
import { buildOpeningDebatePrompt, OPENING_DEBATE_SYSTEM_PROMPT } from "./prompts";
import type { BeliefValidationResult, DebateGenerationResult } from "./types";

const REQUIRED_AGENT_NAMES = ["Mason", "Victor", "Logan", "Theo"] as const;
const ALLOWED_AUTHORS = new Set([
  "Swarm Engine",
  ...REQUIRED_AGENT_NAMES,
] as const);
const MAX_TURN_LENGTH = 220;
const MAX_TOPICS = 5;

type ModelDebateTurn = {
  author?: unknown;
  text?: unknown;
};

type ModelDebatePayload = {
  turns?: unknown;
  summary?: unknown;
  roomTitle?: unknown;
  searchSummary?: unknown;
  topics?: unknown;
};

type GenerateOpeningDebateInput = {
  belief: string;
  validation?: BeliefValidationResult;
};

function failureResult(belief: string, error: string): DebateGenerationResult {
  return {
    ok: false,
    belief,
    messages: [],
    agents: [],
    error,
  };
}

function stringOrUndefined(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function normalizeTopics(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;

  const topics = value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean)
    .slice(0, MAX_TOPICS);

  return topics.length ? topics : undefined;
}

function truncateTurn(text: string): string {
  const trimmed = text.trim().replace(/\s+/g, " ");
  if (trimmed.length <= MAX_TURN_LENGTH) return trimmed;

  const clipped = trimmed.slice(0, MAX_TURN_LENGTH - 1);
  const sentenceEnd = Math.max(
    clipped.lastIndexOf("."),
    clipped.lastIndexOf("!"),
    clipped.lastIndexOf("?"),
  );

  if (sentenceEnd >= 80) {
    return clipped.slice(0, sentenceEnd + 1);
  }

  return `${clipped.trim()}…`;
}

function hasUnsafeOrUnusableText(text: string): boolean {
  return /\bas an ai\b/i.test(text) || /\bi cannot provide\b/i.test(text);
}

function parseModelPayload(raw: string): ModelDebatePayload {
  return JSON.parse(raw) as ModelDebatePayload;
}

function getAgentSlugByName(name: string): AgentSlug | null {
  return AGENT_PROFILES.find((agent) => agent.name === name)?.slug ?? null;
}

function normalizeTurns(payload: ModelDebatePayload): ChatMessage[] | null {
  if (!Array.isArray(payload.turns)) return null;

  const turns = payload.turns as ModelDebateTurn[];
  const messages: ChatMessage[] = [];

  for (const turn of turns) {
    const author = stringOrUndefined(turn.author);
    const text = stringOrUndefined(turn.text);

    if (!author || !text || !ALLOWED_AUTHORS.has(author as never)) {
      return null;
    }

    const normalizedText = truncateTurn(text);
    if (hasUnsafeOrUnusableText(normalizedText)) return null;

    messages.push({
      id: `msg-${messages.length}`,
      author,
      text: normalizedText,
    });
  }

  if (messages[0]?.author !== "Swarm Engine") return null;

  const authorOrder = messages.map((message) => message.author);
  const requiredAgentsPresent = REQUIRED_AGENT_NAMES.every((agent) =>
    authorOrder.includes(agent),
  );

  if (!requiredAgentsPresent) return null;

  const firstAgentIndexes = REQUIRED_AGENT_NAMES.map((agent) =>
    authorOrder.indexOf(agent),
  );
  const agentsInOrder = firstAgentIndexes.every(
    (index, position) =>
      index > 0 && (position === 0 || index > firstAgentIndexes[position - 1]),
  );

  if (!agentsInOrder) return null;

  return messages;
}

function getRespondingAgents(messages: ChatMessage[]): AgentSlug[] {
  const slugs = messages
    .map((message) => getAgentSlugByName(message.author))
    .filter((slug): slug is AgentSlug => slug != null);

  return [...new Set(slugs)];
}

function normalizeDebateResult(
  belief: string,
  payload: ModelDebatePayload,
): DebateGenerationResult {
  const messages = normalizeTurns(payload);
  if (!messages) {
    return failureResult(belief, "Generated debate was incomplete.");
  }

  const agents = getRespondingAgents(messages);

  return {
    ok: true,
    belief,
    messages,
    agents,
    summary: stringOrUndefined(payload.summary),
    roomTitle: stringOrUndefined(payload.roomTitle),
    searchSummary: stringOrUndefined(payload.searchSummary),
    topics: normalizeTopics(payload.topics),
  };
}

export async function generateOpeningDebate({
  belief,
  validation,
}: GenerateOpeningDebateInput): Promise<DebateGenerationResult> {
  const normalizedBelief = belief.trim();
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return failureResult(normalizedBelief, "OPENAI_API_KEY is not configured.");
  }

  try {
    const client = new OpenAI({ apiKey });
    const completion = await client.chat.completions.create({
      model: process.env.OPENAI_DEBATE_MODEL ?? "gpt-4o-mini",
      temperature: 0.8,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: OPENING_DEBATE_SYSTEM_PROMPT },
        {
          role: "user",
          content: buildOpeningDebatePrompt({
            belief: normalizedBelief,
            agents: AGENT_PROFILES,
            validation,
          }),
        },
      ],
    });

    const content = completion.choices[0]?.message.content;
    if (!content) {
      return failureResult(normalizedBelief, "OpenAI returned an empty debate.");
    }

    return normalizeDebateResult(normalizedBelief, parseModelPayload(content));
  } catch {
    return failureResult(normalizedBelief, "Could not generate debate.");
  }
}
