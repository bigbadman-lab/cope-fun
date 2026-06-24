import type { MarketStatus } from "@/lib/markets/types";

export type MarketDisplayStatus =
  | "draft"
  | "open"
  | "awaiting_resolution"
  | "closed"
  | "resolved"
  | "voided";

export const COPE_CREDITS_DISCLAIMER =
  "COPE Credits are in-app points for Season 1. They are not real money, not transferable, and not withdrawable.";

export const SEASON_1_AIRDROP_NOTE =
  "Season 1 leaderboard may be used to determine eligibility for a future COPE token airdrop. Exact criteria and allocations are not guaranteed.";

export function getMarketDisplayStatus(
  dbStatus: MarketStatus,
  closesAt: string,
  now: number = Date.now(),
): MarketDisplayStatus {
  if (dbStatus === "open" && new Date(closesAt).getTime() <= now) {
    return "awaiting_resolution";
  }

  return dbStatus;
}

export function canStakeOnMarket(
  dbStatus: MarketStatus,
  closesAt: string,
  now: number = Date.now(),
): boolean {
  return dbStatus === "open" && new Date(closesAt).getTime() > now;
}

export function isExpiredOpenMarket(
  dbStatus: MarketStatus,
  closesAt: string,
  now: number = Date.now(),
): boolean {
  return dbStatus === "open" && new Date(closesAt).getTime() <= now;
}

export function isAwaitingResolution(
  dbStatus: MarketStatus,
  closesAt: string,
  now: number = Date.now(),
): boolean {
  const display = getMarketDisplayStatus(dbStatus, closesAt, now);
  return display === "awaiting_resolution" || display === "closed";
}

export function getMarketDisplayStatusLabel(status: MarketDisplayStatus): string {
  switch (status) {
    case "draft":
      return "Draft";
    case "open":
      return "Open";
    case "awaiting_resolution":
      return "Awaiting resolution";
    case "closed":
      return "Closed";
    case "resolved":
      return "Resolved";
    case "voided":
      return "Voided";
  }
}
