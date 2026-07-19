import type { ChatMessage } from "@/components/debate-chat";

const ENGINE_AUTHOR = "Swarm Engine";
const GROUP_FORMATION_TEXT =
  "Swarm Engine added Mason, Victor, Logan and Theo";

const ALLOWED_AGENT_AUTHORS = new Set(["Mason", "Victor", "Logan", "Theo"]);

const AGENT_PRIORITY: Record<string, number> = {
  Victor: 40,
  Mason: 30,
  Logan: 20,
  Theo: 10,
};

const MIN_QUOTE_LENGTH = 20;
const MAX_QUOTE_LENGTH = 160;

export type OgQuote = {
  author: string;
  text: string;
};

function normalizeText(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

function isCandidate(message: ChatMessage): boolean {
  if (message.isUser) return false;
  if (message.author === ENGINE_AUTHOR) return false;
  if (!ALLOWED_AGENT_AUTHORS.has(message.author)) return false;

  const text = normalizeText(message.text);
  if (text === GROUP_FORMATION_TEXT) return false;
  if (text.length < MIN_QUOTE_LENGTH || text.length > MAX_QUOTE_LENGTH) {
    return false;
  }

  return true;
}

function scoreQuote(message: ChatMessage, index: number): number {
  const text = normalizeText(message.text);
  let score = AGENT_PRIORITY[message.author] ?? 0;

  if (/[?!]/.test(text)) score += 8;

  const wordCount = text.split(/\s+/).filter(Boolean).length;
  if (wordCount >= 8 && wordCount <= 22) score += 10;

  if (text.length > 120) score -= (text.length - 120) * 0.5;
  if (message.isAttentionChallenge) score -= 5;

  return score - index * 0.01;
}

export function selectOgQuote(messages: ChatMessage[]): OgQuote | null {
  const candidates = messages
    .map((message, index) => ({ message, index }))
    .filter(({ message }) => isCandidate(message));

  if (candidates.length === 0) return null;

  const best = candidates.reduce((top, current) =>
    scoreQuote(current.message, current.index) >
    scoreQuote(top.message, top.index)
      ? current
      : top,
  );

  return {
    author: best.message.author,
    text: normalizeText(best.message.text),
  };
}
