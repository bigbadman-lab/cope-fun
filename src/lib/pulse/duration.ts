import "server-only";

export const ALLOWED_PULSE_ROUND_DURATIONS = [15, 30, 60, 300, 900] as const;

export type PulseRoundDurationSeconds =
  (typeof ALLOWED_PULSE_ROUND_DURATIONS)[number];

export const DEFAULT_PULSE_ROUND_DURATION_SECONDS = 900;

export function isAllowedPulseRoundDuration(
  value: number,
): value is PulseRoundDurationSeconds {
  return (ALLOWED_PULSE_ROUND_DURATIONS as readonly number[]).includes(value);
}

export function formatPulseRoundDurationLabel(
  seconds: PulseRoundDurationSeconds,
): string {
  switch (seconds) {
    case 15:
      return "15s (dev)";
    case 30:
      return "30s (dev)";
    case 60:
      return "60s (1 min)";
    case 300:
      return "300s (5 min)";
    case 900:
      return "900s (15 min, prod default)";
    default:
      return `${seconds}s`;
  }
}
