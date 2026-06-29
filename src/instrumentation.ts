// Boots the standalone CoinGecko price WebSocket once per Node.js server process.
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") {
    return;
  }

  const { startPriceWebSocketService } = await import("@/lib/prices/service");
  startPriceWebSocketService();
}
