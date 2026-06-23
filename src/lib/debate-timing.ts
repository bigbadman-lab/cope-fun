type Range = readonly [number, number];

const TYPING_RANGES: Record<string, Range> = {
  "Cope Engine": [700, 950],
  Mason: [1500, 2100],
  Victor: [2100, 3000],
  Logan: [1400, 2000],
  Theo: [2400, 3400],
};

const DEFAULT_TYPING_RANGE: Range = [1500, 2200];
const GAP_BETWEEN_AGENTS_RANGE: Range = [550, 1250];
const TYPING_FADE_OUT_MS = 250;
const CTA_AFTER_LAST_MESSAGE_MS = 650;

function randomInRange([min, max]: Range): number {
  return Math.floor(min + Math.random() * (max - min + 1));
}

export type DebateTurnTiming = {
  author: string;
  typingStartMs: number;
  typingFadeMs: number;
  messageMs: number;
  typingDurationMs: number;
};

export function buildDebateTurnTimings(
  authors: string[],
): { turns: DebateTurnTiming[]; ctaDelayMs: number } {
  let elapsed = 0;
  const turns: DebateTurnTiming[] = [];

  authors.forEach((author, index) => {
    if (index > 0) {
      elapsed += randomInRange(GAP_BETWEEN_AGENTS_RANGE);
    }

    const typingDurationMs = randomInRange(
      TYPING_RANGES[author] ?? DEFAULT_TYPING_RANGE,
    );
    const typingStartMs = elapsed;
    const typingFadeMs = typingStartMs + typingDurationMs - TYPING_FADE_OUT_MS;
    const messageMs = typingStartMs + typingDurationMs;

    turns.push({
      author,
      typingStartMs,
      typingFadeMs,
      messageMs,
      typingDurationMs,
    });

    elapsed = messageMs;
  });

  return {
    turns,
    ctaDelayMs: elapsed + CTA_AFTER_LAST_MESSAGE_MS,
  };
}

export { TYPING_FADE_OUT_MS };
