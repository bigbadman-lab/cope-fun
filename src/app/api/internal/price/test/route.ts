import { NextResponse } from "next/server";
import {
  CoingeckoPriceError,
  fetchSolUsdPriceFromCoingeckoRest,
} from "@/lib/price/coingecko-rest";

export async function GET() {
  try {
    const result = await fetchSolUsdPriceFromCoingeckoRest();

    return NextResponse.json({
      ok: true,
      asset: result.asset,
      quote: result.quote,
      price: result.price,
      source: result.source,
      updatedAt: result.updatedAt,
    });
  } catch (error) {
    if (error instanceof CoingeckoPriceError) {
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: error.status },
      );
    }

    return NextResponse.json(
      { ok: false, error: "Could not fetch SOL/USD price." },
      { status: 500 },
    );
  }
}
