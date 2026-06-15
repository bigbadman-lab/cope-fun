import type { ChatMessage } from "@/components/debate-chat";
import { TYPING_FADE_OUT_MS } from "@/lib/debate-timing";

type Range = readonly [number, number];

const TYPING_RANGES: Record<string, Range> = {
  "Cope Engine": [350, 550],
  Mason: [600, 900],
  Victor: [1200, 1800],
  Logan: [500, 800],
  Theo: [1500, 2200],
};

const DEFAULT_TYPING_RANGE: Range = [700, 1000];
const GAP_AFTER_USER_RANGE: Range = [500, 900];
const GAP_AFTER_AGENT_RANGE: Range = [120, 950];
const INITIAL_DELAY_MS = 450;

function randomInRange([min, max]: Range): number {
  return Math.floor(min + Math.random() * (max - min + 1));
}

export type ScriptedConversationCallbacks = {
  onShowUser: (index: number) => void;
  onAgentTypingStart: (index: number) => void;
  onAgentTypingFade: (index: number) => void;
  onAgentMessage: (index: number) => void;
};

export function scheduleScriptedConversation(
  messages: ChatMessage[],
  callbacks: ScriptedConversationCallbacks,
): () => void {
  const timeouts: ReturnType<typeof setTimeout>[] = [];
  let elapsed = INITIAL_DELAY_MS;

  messages.forEach((message, index) => {
    if (message.isUser) {
      timeouts.push(
        setTimeout(() => callbacks.onShowUser(index), elapsed),
      );
      elapsed += randomInRange(GAP_AFTER_USER_RANGE);
      return;
    }

    const typingMs = randomInRange(
      TYPING_RANGES[message.author] ?? DEFAULT_TYPING_RANGE,
    );

    timeouts.push(
      setTimeout(() => callbacks.onAgentTypingStart(index), elapsed),
    );
    timeouts.push(
      setTimeout(
        () => callbacks.onAgentTypingFade(index),
        elapsed + typingMs - TYPING_FADE_OUT_MS,
      ),
    );
    timeouts.push(
      setTimeout(() => callbacks.onAgentMessage(index), elapsed + typingMs),
    );

    elapsed += typingMs + randomInRange(GAP_AFTER_AGENT_RANGE);
  });

  return () => timeouts.forEach(clearTimeout);
}
