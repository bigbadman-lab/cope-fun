type Range = readonly [number, number];

const TYPING_RANGES: Record<string, Range> = {
  "Cope Engine": [350, 550],
  Mason: [600, 900],
  Victor: [1200, 1800],
  Logan: [500, 800],
  Theo: [1500, 2200],
};

const DEFAULT_TYPING_RANGE: Range = [700, 1000];
const GAP_BETWEEN_AGENTS_RANGE: Range = [120, 950];
const TYPING_FADE_OUT_MS = 250;
const CTA_AFTER_LAST_MESSAGE_MS = 400;

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
