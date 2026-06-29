import "server-only";

/**
 * Server-only entrypoint for the standalone Cope Price Service.
 * Pulse Engine, admin tooling, and internal APIs should import from here.
 */
export { getLatestCachedSolUsdPrice, startPriceWebSocketService } from "@/lib/prices/service";
export { getPriceAgeMs, isPriceStale, PRICE_STALE_AFTER_MS } from "@/lib/prices/stale";
export type {
  CachedPriceSnapshot,
  PriceAsset,
  PriceConnectionStatus,
  PriceQuote,
  PriceSource,
} from "@/lib/prices/types";
