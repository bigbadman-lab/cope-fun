"use client";

import { useCallback, useEffect, useState } from "react";

const POLL_INTERVAL_MS = 5_000;

type PriceSuccess = {
  ok: true;
  asset: string;
  quote: string;
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

type PriceError = {
  ok: false;
  error: string;
  message: string;
  connectionStatus: string;
  lastPrice?: number;
  updatedAt?: string;
  priceAgeMs?: number | null;
};

type PriceResponse = PriceSuccess | PriceError;

function formatPrice(price: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(price);
}

function formatAge(priceAgeMs: number | null | undefined): string {
  if (priceAgeMs === null || priceAgeMs === undefined) {
    return "—";
  }

  if (priceAgeMs < 1000) {
    return "just now";
  }

  const seconds = Math.round(priceAgeMs / 1000);
  return `${seconds}s ago`;
}

function formatSource(source: string): string {
  if (source === "websocket") {
    return "WebSocket";
  }

  if (source === "rest_fallback") {
    return "REST fallback";
  }

  return source;
}

function formatTimestamp(updatedAt: string): string {
  const timestamp = Date.parse(updatedAt);
  if (!Number.isFinite(timestamp)) {
    return updatedAt;
  }

  return new Date(timestamp).toLocaleString();
}

export function LiveSolPrice() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<PriceSuccess | null>(null);
  const [error, setError] = useState<PriceError | null>(null);

  const fetchPrice = useCallback(async () => {
    try {
      const response = await fetch("/api/internal/price", { cache: "no-store" });
      const payload = (await response.json()) as PriceResponse;

      if (response.ok && payload.ok) {
        setData(payload);
        setError(null);
        return;
      }

      if (!payload.ok) {
        setError(payload);
        setData(null);
        return;
      }

      setError({
        ok: false,
        error: "unknown_error",
        message: "Unexpected response from the price API.",
        connectionStatus: "unknown",
      });
      setData(null);
    } catch {
      setError({
        ok: false,
        error: "network_error",
        message: "Could not reach the price API.",
        connectionStatus: "unknown",
      });
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchPrice();

    const interval = setInterval(() => {
      void fetchPrice();
    }, POLL_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [fetchPrice]);

  if (loading) {
    return (
      <div className="rounded-xl border border-zinc-200 bg-surface px-5 py-6 dark:border-zinc-800">
        <p className="text-sm text-muted">Loading SOL/USD price…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-500/30 bg-red-500/[0.06] px-5 py-6">
        <p className="text-sm font-medium text-red-700 dark:text-red-300">
          {error.message}
        </p>
        <dl className="mt-4 space-y-3 text-sm">
          <div className="flex items-center justify-between gap-4">
            <dt className="text-muted">Error</dt>
            <dd className="font-mono text-foreground">{error.error}</dd>
          </div>
          <div className="flex items-center justify-between gap-4">
            <dt className="text-muted">Connection</dt>
            <dd className="font-mono text-foreground">{error.connectionStatus}</dd>
          </div>
          {typeof error.lastPrice === "number" && (
            <div className="flex items-center justify-between gap-4">
              <dt className="text-muted">Last price</dt>
              <dd className="font-mono text-foreground">
                {formatPrice(error.lastPrice)}
              </dd>
            </div>
          )}
          {error.updatedAt && (
            <div className="flex items-center justify-between gap-4">
              <dt className="text-muted">Last updated</dt>
              <dd className="font-mono text-foreground">
                {formatTimestamp(error.updatedAt)}
              </dd>
            </div>
          )}
          {error.priceAgeMs !== undefined && (
            <div className="flex items-center justify-between gap-4">
              <dt className="text-muted">Price age</dt>
              <dd className="font-mono text-foreground">
                {formatAge(error.priceAgeMs)}
              </dd>
            </div>
          )}
        </dl>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <div className="rounded-xl border border-zinc-200 bg-surface px-5 py-6 dark:border-zinc-800">
      <div className="mb-6">
        <p className="text-sm text-muted">
          {data.asset}/{data.quote}
        </p>
        <p className="mt-1 font-mono text-4xl font-semibold tracking-tight text-foreground">
          {formatPrice(data.price)}
        </p>
      </div>

      <dl className="space-y-3 text-sm">
        <div className="flex items-center justify-between gap-4">
          <dt className="text-muted">Source</dt>
          <dd className="font-mono text-foreground">{formatSource(data.source)}</dd>
        </div>
        <div className="flex items-center justify-between gap-4">
          <dt className="text-muted">Connection</dt>
          <dd className="font-mono text-foreground">{data.connectionStatus}</dd>
        </div>
        <div className="flex items-center justify-between gap-4">
          <dt className="text-muted">Updated</dt>
          <dd className="font-mono text-foreground">
            {formatTimestamp(data.updatedAt)}
          </dd>
        </div>
        <div className="flex items-center justify-between gap-4">
          <dt className="text-muted">Price age</dt>
          <dd className="font-mono text-foreground">{formatAge(data.priceAgeMs)}</dd>
        </div>
      </dl>

      {data.staleWebSocketPrice && (
        <div className="mt-6 rounded-lg border border-cope-orange/20 bg-cope-orange/[0.06] px-4 py-3 text-sm">
          <p className="font-medium text-foreground">Stale WebSocket price</p>
          <p className="mt-1 font-mono text-muted">
            {formatPrice(data.staleWebSocketPrice.price)} ·{" "}
            {formatAge(data.staleWebSocketPrice.priceAgeMs)}
          </p>
        </div>
      )}

      <p className="mt-6 text-xs text-muted">Refreshes every 5 seconds.</p>
    </div>
  );
}
