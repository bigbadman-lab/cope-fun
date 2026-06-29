import "server-only";

import type { CachedPriceSnapshot, PriceConnectionStatus } from "@/lib/prices/types";

const INITIAL_SNAPSHOT: CachedPriceSnapshot = {
  asset: "SOL",
  quote: "USD",
  price: null,
  source: "websocket",
  updatedAt: null,
  connectionStatus: "disconnected",
};

type PriceCacheState = {
  snapshot: CachedPriceSnapshot;
};

const GLOBAL_CACHE_KEY = Symbol.for("cope.priceCache");

function getCacheState(): PriceCacheState {
  const globalState = globalThis as typeof globalThis & {
    [GLOBAL_CACHE_KEY]?: PriceCacheState;
  };

  if (!globalState[GLOBAL_CACHE_KEY]) {
    globalState[GLOBAL_CACHE_KEY] = {
      snapshot: { ...INITIAL_SNAPSHOT },
    };
  }

  return globalState[GLOBAL_CACHE_KEY];
}

/** Pulse and internal APIs should read live WebSocket ticks through this snapshot. */
export function getCachedPriceSnapshot(): CachedPriceSnapshot {
  return { ...getCacheState().snapshot };
}

export function setConnectionStatus(connectionStatus: PriceConnectionStatus): void {
  const state = getCacheState();
  state.snapshot = {
    ...state.snapshot,
    connectionStatus,
  };
}

export function updateCachedPrice(price: number, updatedAt: string): void {
  const state = getCacheState();
  state.snapshot = {
    ...state.snapshot,
    price,
    updatedAt,
    source: "websocket",
  };
}
