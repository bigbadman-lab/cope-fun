import { NextResponse } from "next/server";
import {
  resolveSolUsdPrice,
  SolUsdPriceStaleError,
  SolUsdPriceUnavailableError,
} from "@/lib/prices/resolve-sol-usd-price";

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
  try {
    const price = await resolveSolUsdPrice();

    return noStoreJson({
      ok: true,
      asset: price.asset,
      quote: price.quote,
      price: price.price,
      source: price.source,
      updatedAt: price.updatedAt,
      connectionStatus: price.connectionStatus,
      priceAgeMs: price.priceAgeMs,
      ...(price.staleWebSocketPrice
        ? { staleWebSocketPrice: price.staleWebSocketPrice }
        : {}),
    });
  } catch (error) {
    if (error instanceof SolUsdPriceUnavailableError) {
      return noStoreJson(
        {
          ok: false,
          error: "price_unavailable",
          message: error.message,
          connectionStatus: error.connectionStatus,
        },
        { status: 503 },
      );
    }

    if (error instanceof SolUsdPriceStaleError) {
      return noStoreJson(
        {
          ok: false,
          error: "price_stale",
          message: error.message,
          lastPrice: error.lastPrice,
          updatedAt: error.updatedAt,
          connectionStatus: error.connectionStatus,
          priceAgeMs: error.priceAgeMs,
        },
        { status: 503 },
      );
    }

    console.error("[price-service] unexpected resolve error:", error);

    return noStoreJson(
      {
        ok: false,
        error: "price_unavailable",
        message: "SOL/USD price is not available yet.",
        connectionStatus: "unknown",
      },
      { status: 503 },
    );
  }
}
