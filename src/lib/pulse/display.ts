import type { PulseRoundStatus, PulseWinningSide } from "@/lib/pulse/types";

export function formatPulsePrice(value: number | null): string {
  if (value === null) return "—";
  return `$${value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatPulseCountdown(secondsRemaining: number | null): string {
  if (secondsRemaining === null) return "—";
  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export function pulseRoundStateLabel(
  status: PulseRoundStatus | string | null,
  secondsRemaining: number | null = null,
): string {
  if (!status) return "Pending";

  switch (status) {
    case "pending":
      return "Pending";
    case "open":
      return secondsRemaining === 0 ? "Closing" : "Open";
    case "locked":
      return "Locked";
    case "settling":
      return "Settling";
    case "settled":
      return "Settled";
    case "cancelled":
      return "Cancelled";
    case "errored":
      return "Needs review";
    default:
      return status;
  }
}

export function pulseWinningSideLabel(side: PulseWinningSide | null): string {
  if (side === "believe") return "Believe";
  if (side === "cope") return "Cope";
  if (side === "draw") return "Draw";
  return "—";
}

export function pulsePositionStatusLabel(input: {
  side: "believe" | "cope";
  roundStatus: PulseRoundStatus;
  currentlyWinningSide: PulseWinningSide | null;
}): string {
  const { side, roundStatus, currentlyWinningSide } = input;

  if (roundStatus === "pending") return "Waiting for round";
  if (roundStatus === "locked" || roundStatus === "settling") {
    return currentlyWinningSide
      ? `${pulseWinningSideLabel(currentlyWinningSide)} winning`
      : "Round locked";
  }

  if (!currentlyWinningSide) return "In play";
  if (currentlyWinningSide === "draw") return "Drawing";
  if (currentlyWinningSide === side) return "Winning";
  return "Losing";
}
