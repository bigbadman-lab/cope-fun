import type { ChatMessage } from "@/components/debate-chat";
import { TYPING_FADE_OUT_MS } from "@/lib/debate-timing";

type Range = readonly [number, number];

const TYPING_RANGES: Record<string, Range> = {
  "Swarm Engine": [350, 550],
};

const DEFAULT_TYPING_RANGE: Range = [700, 1000];
const GAP_AFTER_MESSAGE_RANGE: Range = [320, 520];
const INITIAL_DELAY_MS = 450;

function randomInRange([min, max]: Range): number {
  return Math.floor(min + Math.random() * (max - min + 1));
}

export type ScriptedTransmissionCallbacks = {
  onAgentTypingStart: (index: number) => void;
  onAgentTypingFade: (index: number) => void;
  onAgentMessage: (index: number) => void;
  onComplete?: () => void;
};

export function scheduleScriptedTransmission(
  messages: ChatMessage[],
  callbacks: ScriptedTransmissionCallbacks,
): () => void {
  const timeouts: ReturnType<typeof setTimeout>[] = [];
  let elapsed = INITIAL_DELAY_MS;

  messages.forEach((message, index) => {
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

    elapsed += typingMs + randomInRange(GAP_AFTER_MESSAGE_RANGE);
  });

  if (callbacks.onComplete) {
    timeouts.push(setTimeout(() => callbacks.onComplete?.(), elapsed + 200));
  }

  return () => timeouts.forEach(clearTimeout);
}
