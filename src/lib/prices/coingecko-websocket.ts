import "server-only";

import { getCoingeckoApiKey } from "@/lib/price/coingecko-rest";
import {
  getCachedPriceSnapshot,
  setConnectionStatus,
  updateCachedPrice,
} from "@/lib/prices/cache";
import type { PriceConnectionStatus } from "@/lib/prices/types";

const LOG_PREFIX = "[price-service]";
const COINGECKO_WS_BASE_URL = "wss://stream.coingecko.com/v1";
const CG_SIMPLE_PRICE_IDENTIFIER = '{"channel":"CGSimplePrice"}';
const SOL_PROVIDER_ASSET_ID = "solana";
const SOL_QUOTE_CURRENCY = "usd";

const INITIAL_RECONNECT_DELAY_MS = 1_000;
const MAX_RECONNECT_DELAY_MS = 60_000;

type CoinGeckoControlMessage = {
  code?: number;
  message?: string;
  type?: string;
  identifier?: string;
};

type CoinGeckoPriceMessage = {
  c?: string;
  i?: string;
  vs?: string;
  p?: number;
  t?: number;
};

export class CoinGeckoWebSocketClient {
  private ws: WebSocket | null = null;
  private reconnectAttempt = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private started = false;
  private subscribed = false;
  private connecting = false;
  private connectionEpoch = 0;

  start(): void {
    if (this.started) {
      return;
    }

    this.started = true;
    this.connect();
  }

  getConnectionStatus(): PriceConnectionStatus {
    return getCachedPriceSnapshot().connectionStatus;
  }

  private log(event: string, detail?: string): void {
    if (detail) {
      console.info(`${LOG_PREFIX} ${event}: ${detail}`);
      return;
    }

    console.info(`${LOG_PREFIX} ${event}`);
  }

  private connect(): void {
    if (this.connecting) {
      return;
    }

    this.clearReconnectTimer();

    const apiKey = getCoingeckoApiKey();
    if (!apiKey) {
      this.log("disconnected", "COINGECKO_API_KEY is not configured");
      setConnectionStatus("disconnected");
      return;
    }

    this.connecting = true;
    const epoch = ++this.connectionEpoch;

    if (this.ws) {
      const staleSocket = this.ws;
      this.ws = null;
      staleSocket.close();
    }

    setConnectionStatus(this.reconnectAttempt > 0 ? "reconnecting" : "connecting");

    const url = new URL(COINGECKO_WS_BASE_URL);
    // CoinGecko WS requires the key in the query string; never log this URL.
    url.searchParams.set("x_cg_pro_api_key", apiKey);

    let socket: WebSocket;
    try {
      socket = new WebSocket(url.toString());
    } catch (error) {
      this.connecting = false;
      const message = error instanceof Error ? error.message : "unknown error";
      this.log("disconnected", `failed to open socket (${message})`);
      setConnectionStatus("disconnected");
      this.scheduleReconnect();
      return;
    }

    this.ws = socket;
    this.subscribed = false;

    socket.addEventListener("open", () => {
      if (epoch !== this.connectionEpoch) {
        return;
      }

      this.connecting = false;
      this.log("connected");
      setConnectionStatus("connected");
    });

    socket.addEventListener("message", (event) => {
      if (epoch !== this.connectionEpoch) {
        return;
      }

      try {
        this.handleMessage(String(event.data));
      } catch (error) {
        const message = error instanceof Error ? error.message : "unknown error";
        this.log("disconnected", `failed to handle message (${message})`);
      }
    });

    socket.addEventListener("error", () => {
      if (epoch !== this.connectionEpoch) {
        return;
      }

      this.log("disconnected", "socket error");
    });

    socket.addEventListener("close", () => {
      if (epoch !== this.connectionEpoch) {
        return;
      }

      this.connecting = false;
      this.ws = null;
      this.subscribed = false;
      this.log("disconnected");
      setConnectionStatus("disconnected");
      this.scheduleReconnect();
    });
  }

  private handleMessage(rawMessage: string): void {
    let payload: unknown;
    try {
      payload = JSON.parse(rawMessage);
    } catch {
      this.log("disconnected", "received invalid JSON from CoinGecko");
      return;
    }

    if (!payload || typeof payload !== "object") {
      return;
    }

    const message = payload as CoinGeckoControlMessage & CoinGeckoPriceMessage;

    if (message.type === "welcome" || message.code === 3000) {
      if (getCachedPriceSnapshot().connectionStatus !== "authenticated") {
        this.log("authenticated");
        setConnectionStatus("authenticated");
      }

      this.sendSubscribe();
      return;
    }

    if (message.type === "confirm_subscription") {
      this.sendSetTokens();
      return;
    }

    if (
      message.code === 2000 &&
      typeof message.message === "string" &&
      message.message.toLowerCase().includes("subscribed")
    ) {
      this.subscribed = true;
      this.reconnectAttempt = 0;
      this.log("subscribed", message.message);
      setConnectionStatus("subscribed");
      return;
    }

    if (
      message.c === "C1" &&
      message.i === SOL_PROVIDER_ASSET_ID &&
      message.vs === SOL_QUOTE_CURRENCY &&
      typeof message.p === "number" &&
      Number.isFinite(message.p)
    ) {
      const updatedAt =
        typeof message.t === "number" && Number.isFinite(message.t)
          ? new Date(message.t * 1000).toISOString()
          : new Date().toISOString();

      updateCachedPrice(message.p, updatedAt);

      if (!this.subscribed) {
        this.subscribed = true;
        this.reconnectAttempt = 0;
        setConnectionStatus("subscribed");
      }
    }
  }

  private sendSubscribe(): void {
    this.sendJson({
      command: "subscribe",
      identifier: CG_SIMPLE_PRICE_IDENTIFIER,
    });
  }

  private sendSetTokens(): void {
    this.sendJson({
      command: "message",
      identifier: CG_SIMPLE_PRICE_IDENTIFIER,
      data: JSON.stringify({
        coin_id: [SOL_PROVIDER_ASSET_ID],
        vs_currencies: [SOL_QUOTE_CURRENCY],
        action: "set_tokens",
      }),
    });
  }

  private sendJson(payload: Record<string, string>): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      return;
    }

    this.ws.send(JSON.stringify(payload));
  }

  private scheduleReconnect(): void {
    if (!this.started) {
      return;
    }

    this.clearReconnectTimer();

    const delayMs = Math.min(
      INITIAL_RECONNECT_DELAY_MS * 2 ** this.reconnectAttempt,
      MAX_RECONNECT_DELAY_MS,
    );

    this.reconnectAttempt += 1;
    this.log("reconnecting", `attempt ${this.reconnectAttempt} in ${delayMs}ms`);
    setConnectionStatus("reconnecting");

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, delayMs);
  }

  private clearReconnectTimer(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }
}
