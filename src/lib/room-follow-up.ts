import type { ChatMessage } from "@/components/debate-chat";
import { USER_DISPLAY_NAME } from "@/components/avatar-placeholder";
import { AGENT_PROFILES } from "@/lib/agent-profiles";

export const MAX_ROOM_ATTENTION = 5;

const RESPONDING_AGENTS = AGENT_PROFILES.map((profile) => profile.name);

const TYPING_MS: Record<string, number> = {
  Mason: 750,
  Victor: 1100,
  Logan: 650,
  Theo: 1300,
};

const DEFAULT_TYPING_MS = 900;
const GAP_BETWEEN_AGENTS_MS = 280;

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function pickRespondingAgents(followUpText: string): string[] {
  const count = 2 + (hashString(followUpText) % 2);
  const seed = hashString(followUpText.toLowerCase());
  const shuffled = [...RESPONDING_AGENTS].sort(
    (a, b) =>
      hashString(`${seed}:${a}`) - hashString(`${seed}:${b}`),
  );
  return shuffled.slice(0, count);
}

function clip(text: string, max = 72): string {
  const trimmed = text.trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max - 1)}…`;
}

const RESPONSE_BUILDERS: Record<
  string,
  (belief: string, followUp: string) => string
> = {
  Mason: (belief, followUp) =>
    `You're pressing on "${clip(followUp)}" — fine. But where's the asymmetric payoff if "${clip(belief, 48)}" is actually right?`,
  Victor: (_belief, followUp) =>
    `"${clip(followUp)}" doesn't repair the weak premise. You're coping with new wording, not new evidence.`,
  Logan: (belief, followUp) =>
    `Okay, but "${clip(followUp)}" still needs a product surface. Who ships this because of "${clip(belief, 48)}"?`,
  Theo: (_belief, followUp) =>
    `Reframe noted: "${clip(followUp)}". I'd still price this below 40% until the base rate moves.`,
};

export function buildFollowUpResponse(
  agent: string,
  belief: string,
  followUp: string,
): string {
  const builder = RESPONSE_BUILDERS[agent];
  return builder ? builder(belief, followUp) : `Still not convinced by "${clip(followUp)}".`;
}

export function createFollowUpUserMessage(text: string, index: number): ChatMessage {
  return {
    id: `followup-user-${Date.now()}-${index}`,
    author: USER_DISPLAY_NAME,
    text: text.trim(),
    isUser: true,
  };
}

export function createFollowUpAgentMessage(
  agent: string,
  text: string,
  index: number,
): ChatMessage {
  return {
    id: `followup-agent-${Date.now()}-${agent}-${index}`,
    author: agent,
    text,
  };
}

export function getAgentTypingDelayMs(agent: string): number {
  return TYPING_MS[agent] ?? DEFAULT_TYPING_MS;
}

export function getGapBetweenAgentsMs(): number {
  return GAP_BETWEEN_AGENTS_MS;
}
