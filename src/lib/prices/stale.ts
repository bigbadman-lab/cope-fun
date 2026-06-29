import "server-only";

import type { PriceConnectionStatus } from "@/lib/prices/types";

/** Pulse health checks should treat prices older than this as stale. */
export const PRICE_STALE_AFTER_MS = 30_000;

export function getPriceAgeMs(updatedAt: string | null): number | null {
  if (!updatedAt) {
    return null;
  }

  const timestamp = Date.parse(updatedAt);
  if (!Number.isFinite(timestamp)) {
    return null;
  }

  return Date.now() - timestamp;
}

export function isPriceStale(
  updatedAt: string | null,
  staleAfterMs: number = PRICE_STALE_AFTER_MS,
): boolean {
  const ageMs = getPriceAgeMs(updatedAt);
  if (ageMs === null) {
    return true;
  }

  return ageMs > staleAfterMs;
}

export function isUnstableConnection(connectionStatus: PriceConnectionStatus): boolean {
  return connectionStatus === "disconnected" || connectionStatus === "reconnecting";
}
