import type { AdminMarketRow } from "@/lib/markets/types";

/** Non-blocking warnings shown before publishing a draft market. */
export function getPublishReadinessWarnings(market: AdminMarketRow): string[] {
  const warnings: string[] = [];

  if (!market.resolutionCriteria.trim()) {
    warnings.push("Resolution criteria is empty.");
  }

  if (!market.closesAt) {
    warnings.push("Close time is missing.");
  } else if (new Date(market.closesAt).getTime() <= Date.now()) {
    warnings.push("Close time is in the past.");
  }

  if (market.displayOrder === null) {
    warnings.push("Display order is not set (recommended for Season 1 launch).");
  }

  if (market.treasuryConvictionCope <= 0) {
    warnings.push("Treasury Conviction is not set.");
  }

  return warnings;
}

export function isTerminalMarketStatus(
  status: AdminMarketRow["status"],
): boolean {
  return status === "resolved" || status === "voided";
}

export function canEditMarketContent(status: AdminMarketRow["status"]): boolean {
  return status === "draft" || status === "open" || status === "closed";
}
