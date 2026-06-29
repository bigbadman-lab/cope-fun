import { NextResponse } from "next/server";
import {
  CoingeckoPriceError,
  fetchSolUsdPriceFromCoingeckoRest,
} from "@/lib/price/coingecko-rest";
import { getLatestCachedSolUsdPrice } from "@/lib/prices/service";
import { getPriceAgeMs, isPriceStale } from "@/lib/prices/stale";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const NO_STORE_HEADERS = {
  "Cache-Control": "no-store, max-age=0",
};

function noStoreJson<T>(body: T, init?: ResponseInit): NextResponse<T> {
  return NextResponse.json(body, {
    ...init,
    headers: {
      ...NO_STORE_HEADERS,
      ...init?.headers,
    },
  });
}

export async function GET() {
  const snapshot = getLatestCachedSolUsdPrice();
  const { connectionStatus } = snapshot;

  const hasWebSocketPrice =
    snapshot.price !== null && snapshot.updatedAt !== null;

  if (hasWebSocketPrice && !isPriceStale(snapshot.updatedAt)) {
    return noStoreJson({
      ok: true,
      asset: snapshot.asset,
      quote: snapshot.quote,
      price: snapshot.price,
      source: "websocket",
      updatedAt: snapshot.updatedAt,
      connectionStatus,
      priceAgeMs: getPriceAgeMs(snapshot.updatedAt),
    });
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
      return noStoreJson(
        {
          ok: false,
          error: "price_unavailable",
          message: "SOL/USD price is not available yet.",
          connectionStatus,
        },
        { status: 503 },
      );
    }

    return noStoreJson({
      ok: true,
      asset: restPrice.asset,
      quote: restPrice.quote,
      price: restPrice.price,
      source: "rest_fallback",
      updatedAt: restPrice.updatedAt,
      connectionStatus,
      priceAgeMs: getPriceAgeMs(restPrice.updatedAt),
    });
  }

  if (!restPrice) {
    return noStoreJson(
      {
        ok: false,
        error: "price_stale",
        message: "SOL/USD price is stale.",
        lastPrice: snapshot.price,
        updatedAt: snapshot.updatedAt,
        connectionStatus,
        priceAgeMs: getPriceAgeMs(snapshot.updatedAt),
      },
      { status: 503 },
    );
  }

  return noStoreJson({
    ok: true,
    asset: restPrice.asset,
    quote: restPrice.quote,
    price: restPrice.price,
    source: "rest_fallback",
    updatedAt: restPrice.updatedAt,
    connectionStatus,
    priceAgeMs: getPriceAgeMs(restPrice.updatedAt),
    staleWebSocketPrice: {
      price: snapshot.price,
      updatedAt: snapshot.updatedAt,
      priceAgeMs: getPriceAgeMs(snapshot.updatedAt),
    },
  });
}
