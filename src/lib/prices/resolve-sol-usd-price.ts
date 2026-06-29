import "server-only";

import { fetchSolUsdPriceFromCoingeckoRest, CoingeckoPriceError } from "@/lib/price/coingecko-rest";
import { getLatestCachedSolUsdPrice } from "@/lib/prices/service";
import { getPriceAgeMs, isPriceStale } from "@/lib/prices/stale";

export type ResolvedSolUsdPrice = {
  asset: "SOL";
  quote: "USD";
  price: number;
  source: "websocket" | "rest_fallback";
  updatedAt: string;
  connectionStatus: string;
  priceAgeMs: number | null;
  staleWebSocketPrice?: {
    price: number;
    updatedAt: string;
    priceAgeMs: number | null;
  };
};

export class SolUsdPriceUnavailableError extends Error {
  connectionStatus: string;

  constructor(connectionStatus: string) {
    super("SOL/USD price is not available yet.");
    this.name = "SolUsdPriceUnavailableError";
    this.connectionStatus = connectionStatus;
  }
}

export class SolUsdPriceStaleError extends Error {
  connectionStatus: string;
  lastPrice: number;
  updatedAt: string;
  priceAgeMs: number | null;

  constructor(input: {
    connectionStatus: string;
    lastPrice: number;
    updatedAt: string;
    priceAgeMs: number | null;
  }) {
    super("SOL/USD price is stale.");
    this.name = "SolUsdPriceStaleError";
    this.connectionStatus = input.connectionStatus;
    this.lastPrice = input.lastPrice;
    this.updatedAt = input.updatedAt;
    this.priceAgeMs = input.priceAgeMs;
  }
}

/** Shared WebSocket-first + REST fallback resolution for Pulse and internal APIs. */
export async function resolveSolUsdPrice(): Promise<ResolvedSolUsdPrice> {
  const snapshot = getLatestCachedSolUsdPrice();
  const { connectionStatus } = snapshot;

  const hasWebSocketPrice =
    snapshot.price !== null && snapshot.updatedAt !== null;

  if (hasWebSocketPrice && !isPriceStale(snapshot.updatedAt)) {
    return {
      asset: snapshot.asset,
      quote: snapshot.quote,
      price: snapshot.price as number,
      source: "websocket",
      updatedAt: snapshot.updatedAt as string,
      connectionStatus,
      priceAgeMs: getPriceAgeMs(snapshot.updatedAt),
    };
  }

  let restPrice: Awaited<ReturnType<typeof fetchSolUsdPriceFromCoingeckoRest>> | null =
    null;

  try {
    restPrice = await fetchSolUsdPriceFromCoingeckoRest();
  } catch (error) {
    const detail =
      error instanceof CoingeckoPriceError
        ? error.message
        : error instanceof Error
          ? error.message
          : "unknown error";
    console.warn("[price-service] REST fallback failed:", detail);
    restPrice = null;
  }

  if (!hasWebSocketPrice) {
    if (!restPrice) {
      throw new SolUsdPriceUnavailableError(connectionStatus);
    }

    return {
      asset: restPrice.asset,
      quote: restPrice.quote,
      price: restPrice.price,
      source: "rest_fallback",
      updatedAt: restPrice.updatedAt,
      connectionStatus,
      priceAgeMs: getPriceAgeMs(restPrice.updatedAt),
    };
  }

  if (!restPrice) {
    throw new SolUsdPriceStaleError({
      connectionStatus,
      lastPrice: snapshot.price as number,
      updatedAt: snapshot.updatedAt as string,
      priceAgeMs: getPriceAgeMs(snapshot.updatedAt),
    });
  }

  return {
    asset: restPrice.asset,
    quote: restPrice.quote,
    price: restPrice.price,
    source: "rest_fallback",
    updatedAt: restPrice.updatedAt,
    connectionStatus,
    priceAgeMs: getPriceAgeMs(restPrice.updatedAt),
    staleWebSocketPrice: {
      price: snapshot.price as number,
      updatedAt: snapshot.updatedAt as string,
      priceAgeMs: getPriceAgeMs(snapshot.updatedAt),
    },
  };
}
