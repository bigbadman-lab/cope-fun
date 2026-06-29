import "server-only";

const COINGECKO_PRO_API_BASE = "https://pro-api.coingecko.com/api/v3";
const SOL_PROVIDER_ASSET_ID = "solana";

export type CoinGeckoRestPriceResult = {
  asset: "SOL";
  quote: "USD";
  price: number;
  source: "coingecko_rest";
  updatedAt: string;
};

export class CoingeckoPriceError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "CoingeckoPriceError";
    this.status = status;
  }
}

/** Reads COINGECKO_API_KEY from server env only — never use NEXT_PUBLIC_. */
export function getCoingeckoApiKey(): string | null {
  const apiKey = process.env.COINGECKO_API_KEY?.trim();
  return apiKey || null;
}

type CoinGeckoSimplePriceResponse = {
  solana?: {
    usd?: number;
    last_updated_at?: number;
  };
};

export async function fetchSolUsdPriceFromCoingeckoRest(): Promise<CoinGeckoRestPriceResult> {
  const apiKey = getCoingeckoApiKey();
  if (!apiKey) {
    throw new CoingeckoPriceError("COINGECKO_API_KEY is not configured.", 500);
  }

  const url = new URL(`${COINGECKO_PRO_API_BASE}/simple/price`);
  url.searchParams.set("ids", SOL_PROVIDER_ASSET_ID);
  url.searchParams.set("vs_currencies", "usd");
  url.searchParams.set("include_last_updated_at", "true");

  let response: Response;
  try {
    response = await fetch(url, {
      headers: {
        Accept: "application/json",
        "x-cg-pro-api-key": apiKey,
      },
      cache: "no-store",
    });
  } catch {
    throw new CoingeckoPriceError("Could not reach CoinGecko.", 502);
  }

  if (!response.ok) {
    throw new CoingeckoPriceError(
      `CoinGecko request failed with status ${response.status}.`,
      502,
    );
  }

  let payload: CoinGeckoSimplePriceResponse;
  try {
    payload = (await response.json()) as CoinGeckoSimplePriceResponse;
  } catch {
    throw new CoingeckoPriceError("CoinGecko returned invalid JSON.", 502);
  }

  const price = payload.solana?.usd;
  if (typeof price !== "number" || !Number.isFinite(price)) {
    throw new CoingeckoPriceError("CoinGecko returned an invalid SOL/USD price.", 502);
  }

  const lastUpdatedAt = payload.solana?.last_updated_at;
  const updatedAt =
    typeof lastUpdatedAt === "number" && Number.isFinite(lastUpdatedAt)
      ? new Date(lastUpdatedAt * 1000).toISOString()
      : new Date().toISOString();

  return {
    asset: "SOL",
    quote: "USD",
    price,
    source: "coingecko_rest",
    updatedAt,
  };
}
