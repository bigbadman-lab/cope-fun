import "server-only";

import { getCachedPriceSnapshot } from "@/lib/prices/cache";
import { CoinGeckoWebSocketClient } from "@/lib/prices/coingecko-websocket";
import type { CachedPriceSnapshot } from "@/lib/prices/types";

const GLOBAL_SERVICE_KEY = Symbol.for("cope.priceWebSocketService");

type GlobalServiceState = {
  client: CoinGeckoWebSocketClient | null;
  started: boolean;
};

function getServiceState(): GlobalServiceState {
  const globalState = globalThis as typeof globalThis & {
    [GLOBAL_SERVICE_KEY]?: GlobalServiceState;
  };

  if (!globalState[GLOBAL_SERVICE_KEY]) {
    globalState[GLOBAL_SERVICE_KEY] = {
      client: null,
      started: false,
    };
  }

  return globalState[GLOBAL_SERVICE_KEY];
}

function getOrCreateClient(): CoinGeckoWebSocketClient {
  const state = getServiceState();

  if (!state.client) {
    state.client = new CoinGeckoWebSocketClient();
  }

  return state.client;
}

/** Booted once from instrumentation.ts; guarded against duplicate dev HMR starts. */
export function startPriceWebSocketService(): void {
  const state = getServiceState();
  if (state.started) {
    return;
  }

  state.started = true;
  getOrCreateClient().start();
}

/**
 * Primary in-process read API for Pulse Engine and server routes.
 * Returns the latest WebSocket-backed cache entry only — REST fallback is handled by /api/internal/price.
 */
export function getLatestCachedSolUsdPrice(): CachedPriceSnapshot {
  return getCachedPriceSnapshot();
}
