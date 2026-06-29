import "server-only";

export type PriceAsset = "SOL";
export type PriceQuote = "USD";
export type PriceSource = "websocket";

export type PriceConnectionStatus =
  | "disconnected"
  | "connecting"
  | "connected"
  | "authenticated"
  | "subscribed"
  | "reconnecting";

export type CachedPriceSnapshot = {
  asset: PriceAsset;
  quote: PriceQuote;
  price: number | null;
  source: PriceSource;
  updatedAt: string | null;
  connectionStatus: PriceConnectionStatus;
};
