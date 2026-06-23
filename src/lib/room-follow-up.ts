import type { ChatMessage } from "@/components/debate-chat";
import { USER_DISPLAY_NAME } from "@/components/avatar-placeholder";
import { AGENT_PROFILES } from "@/lib/agent-profiles";

export const MAX_ROOM_ATTENTION = 5;

const RESPONDING_AGENTS = AGENT_PROFILES.map((profile) => profile.name);

type TimingRange = readonly [number, number];

const INITIAL_AGENT_TYPING_DELAY_RANGE: TimingRange = [700, 950];

const AGENT_TYPING_RANGES: Record<string, TimingRange> = {
  Mason: [1500, 2100],
  Victor: [1800, 2400],
  Logan: [1400, 2000],
  Theo: [1900, 2400],
};

const DEFAULT_TYPING_RANGE: TimingRange = [1500, 2200];
const GAP_BETWEEN_AGENTS_RANGE: TimingRange = [800, 1150];
const MIN_FOLLOW_UP_LENGTH = 3;
const MAX_FOLLOW_UP_LENGTH = 500;

function randomInRange([min, max]: TimingRange): number {
  return Math.floor(min + Math.random() * (max - min + 1));
}

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

export function validateFollowUpDraft(text: string): string | null {
  const trimmed = text.trim();
  if (!trimmed) return "Add a challenge before spending Attention.";
  if (trimmed.length < MIN_FOLLOW_UP_LENGTH) {
    return "Challenge is too short. Add a little more context.";
  }
  if (trimmed.length > MAX_FOLLOW_UP_LENGTH) {
    return "Challenge is too long. Keep it under 500 characters.";
  }
  if (/^(.)\1{9,}$/i.test(trimmed.replace(/\s+/g, ""))) {
    return "That looks like spam. Try a real challenge.";
  }
  if (/https?:\/\/\S+/i.test(trimmed) && trimmed.split(/\s+/).length <= 2) {
    return "Add your own challenge, not just a link.";
  }
  return null;
}

export function createFollowUpUserMessage(text: string, index: number): ChatMessage {
  return {
    id: `followup-user-${Date.now()}-${index}`,
    author: USER_DISPLAY_NAME,
    text: text.trim(),
    isUser: true,
    isAttentionChallenge: true,
  };
}

export function isAttentionChallengeMessage(message: ChatMessage): boolean {
  return (
    message.isAttentionChallenge === true || message.id.startsWith("followup-user-")
  );
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
  return randomInRange(AGENT_TYPING_RANGES[agent] ?? DEFAULT_TYPING_RANGE);
}

export function getInitialFollowUpTypingDelayMs(): number {
  return randomInRange(INITIAL_AGENT_TYPING_DELAY_RANGE);
}

export function getGapBetweenAgentsMs(): number {
  return randomInRange(GAP_BETWEEN_AGENTS_RANGE);
}
