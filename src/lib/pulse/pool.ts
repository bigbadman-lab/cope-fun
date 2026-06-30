import { PULSE_CYCLE_SEED_CREDITS } from "@/lib/pulse/constants";

export { PULSE_CYCLE_SEED_CREDITS };

export function computePulseUserStakedCredits(
  believePool: number,
  copePool: number,
): number {
  return believePool + copePool;
}

export function computePulseRewardPool(input: {
  seedCredits: number;
  believePool: number;
  copePool: number;
}): number {
  return (
    input.seedCredits +
    computePulseUserStakedCredits(input.believePool, input.copePool)
  );
}

export function formatPulseSeedCreditsLabel(seedCredits: number): string | null {
  if (seedCredits <= 0) {
    return null;
  }

  return `Includes ${seedCredits.toLocaleString()} COPE Credits Cope Seed.`;
}
