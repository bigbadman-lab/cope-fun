import OpenAI from "openai";
import type { ChatMessage } from "@/components/debate-chat";
import { AGENT_PROFILES, type AgentSlug } from "@/lib/agent-profiles";
import {
  buildFollowUpDebatePrompt,
  FOLLOW_UP_DEBATE_SYSTEM_PROMPT,
} from "./prompts";
import type { FollowUpGenerationResult } from "./types";

const ALLOWED_AGENT_NAMES = ["Mason", "Victor", "Logan", "Theo"] as const;
const ALLOWED_AUTHORS = new Set<string>(ALLOWED_AGENT_NAMES);
const MAX_TURN_LENGTH = 220;
const MIN_FOLLOW_UP_LENGTH = 3;
const MAX_FOLLOW_UP_LENGTH = 500;

type ModelFollowUpTurn = {
  author?: unknown;
  text?: unknown;
};

type ModelFollowUpPayload = {
  turns?: unknown;
};

type GenerateFollowUpInput = {
  belief: string;
  followUp: string;
  messages: ChatMessage[];
  attentionRemaining: number;
};

function failureResult(input: {
  belief: string;
  followUp: string;
  error: string;
}): FollowUpGenerationResult {
  return {
    ok: false,
    belief: input.belief,
    followUp: input.followUp,
    messages: [],
    agents: [],
    error: input.error,
  };
}

function stringOrUndefined(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function hasUnsafeOrUnusableText(text: string): boolean {
  return (
    /\bas an ai\b/i.test(text) ||
    /\bi cannot provide\b/i.test(text) ||
    /\bnot financial advice\b/i.test(text) ||
    /\bconsult (a|your) professional\b/i.test(text)
  );
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

function getAgentSlugByName(name: string): AgentSlug | null {
  return AGENT_PROFILES.find((agent) => agent.name === name)?.slug ?? null;
}

function validateFollowUpInput(text: string): string | null {
  const trimmed = text.trim();
  if (!trimmed) return "Attention Challenge is empty.";
  if (trimmed.length < MIN_FOLLOW_UP_LENGTH) return "Attention Challenge is too short.";
  if (trimmed.length > MAX_FOLLOW_UP_LENGTH) return "Attention Challenge is too long.";
  if (/^(.)\1{9,}$/i.test(trimmed.replace(/\s+/g, ""))) {
    return "Attention Challenge looks like spam.";
  }
  if (/https?:\/\/\S+/i.test(trimmed) && trimmed.split(/\s+/).length <= 2) {
    return "Attention Challenge looks like spam.";
  }
  return null;
}

function reduceRoomContext(messages: ChatMessage[]): ChatMessage[] {
  const opening = messages.slice(0, 6);
  const recent = messages.slice(-10);
  const seen = new Set<string>();
  const reduced: ChatMessage[] = [];

  for (const message of [...opening, ...recent]) {
    if (seen.has(message.id)) continue;
    seen.add(message.id);
    reduced.push(message);
  }

  return reduced;
}

function parseModelPayload(raw: string): ModelFollowUpPayload {
  return JSON.parse(raw) as ModelFollowUpPayload;
}

function normalizeTurns(
  payload: ModelFollowUpPayload,
): { messages: ChatMessage[]; agents: AgentSlug[] } | null {
  if (!Array.isArray(payload.turns)) return null;

  const turns = payload.turns as ModelFollowUpTurn[];
  const seenAuthors = new Set<string>();
  const messages: ChatMessage[] = [];
  const agents: AgentSlug[] = [];
  const timestamp = Date.now();

  for (const turn of turns) {
    const author = stringOrUndefined(turn.author);
    const text = stringOrUndefined(turn.text);
    if (!author || !text || !ALLOWED_AUTHORS.has(author)) continue;
    if (seenAuthors.has(author)) continue;

    const normalizedText = truncateTurn(text);
    if (hasUnsafeOrUnusableText(normalizedText)) return null;

    const slug = getAgentSlugByName(author);
    if (!slug) continue;

    seenAuthors.add(author);
    agents.push(slug);
    messages.push({
      id: `followup-agent-ai-${timestamp}-${slug}-${messages.length}`,
      author,
      text: normalizedText,
    });
  }

  if (messages.length < 2 || messages.length > 3) return null;

  return { messages, agents };
}

export async function generateFollowUpReplies({
  belief,
  followUp,
  messages,
  attentionRemaining,
}: GenerateFollowUpInput): Promise<FollowUpGenerationResult> {
  const normalizedBelief = belief.trim();
  const normalizedFollowUp = followUp.trim();
  const invalidReason = validateFollowUpInput(normalizedFollowUp);

  if (invalidReason) {
    return failureResult({
      belief: normalizedBelief,
      followUp: normalizedFollowUp,
      error: invalidReason,
    });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return failureResult({
      belief: normalizedBelief,
      followUp: normalizedFollowUp,
      error: "OPENAI_API_KEY is not configured.",
    });
  }

  try {
    const client = new OpenAI({ apiKey });
    const completion = await client.chat.completions.create({
      model:
        process.env.OPENAI_FOLLOW_UP_MODEL ??
        process.env.OPENAI_DEBATE_MODEL ??
        "gpt-4o-mini",
      temperature: 0.8,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: FOLLOW_UP_DEBATE_SYSTEM_PROMPT },
        {
          role: "user",
          content: buildFollowUpDebatePrompt({
            belief: normalizedBelief,
            followUp: normalizedFollowUp,
            messages: reduceRoomContext(messages),
            agents: AGENT_PROFILES,
            attentionRemaining,
          }),
        },
      ],
    });

    const content = completion.choices[0]?.message.content;
    if (!content) {
      return failureResult({
        belief: normalizedBelief,
        followUp: normalizedFollowUp,
        error: "OpenAI returned an empty follow-up.",
      });
    }

    const normalized = normalizeTurns(parseModelPayload(content));
    if (!normalized) {
      return failureResult({
        belief: normalizedBelief,
        followUp: normalizedFollowUp,
        error: "Generated follow-up was incomplete.",
      });
    }

    return {
      ok: true,
      belief: normalizedBelief,
      followUp: normalizedFollowUp,
      messages: normalized.messages,
      agents: normalized.agents,
    };
  } catch {
    return failureResult({
      belief: normalizedBelief,
      followUp: normalizedFollowUp,
      error: "Could not generate follow-up.",
    });
  }
}
