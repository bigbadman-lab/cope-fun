import { getVotePercentages } from "@/lib/vote";

export type ConvictionPoint = {
  offsetMins: number;
  believePct: number;
};

export type MarketSnapshot = {
  believePct: number;
  copePct: number;
  participants: number;
  volume: number;
  endsAt: string;
  durationHours: number;
  convictionHistory: ConvictionPoint[];
};

export type MarketPosition = {
  side: "believe" | "cope";
  size: number;
};

export type MarketWinner = "believe" | "cope" | "tie";

export const MARKET_DURATION_HOURS = 72;

const DEFAULT_ENTRY_SIZE = 50;
const INCREASE_SIZE = 25;

export function shouldAttachMarket(belief: string): boolean {
  let hash = 0;
  for (let i = 0; i < belief.length; i += 1) {
    hash = (hash << 5) - hash + belief.charCodeAt(i);
    hash |= 0;
  }

  return Math.abs(hash) % 3 === 0;
}

export function isMarketClosed(endsAt: string, now = Date.now()): boolean {
  return new Date(endsAt).getTime() <= now;
}

export function getMarketWinner(
  believePct: number,
  copePct: number,
): MarketWinner {
  if (believePct > copePct) return "believe";
  if (copePct > believePct) return "cope";
  return "tie";
}

export function seedMarketData(
  belief: string,
  believeCount: number,
  copeCount: number,
): MarketSnapshot {
  let hash = 0;
  for (let i = 0; i < belief.length; i += 1) {
    hash = (hash << 5) - hash + belief.charCodeAt(i);
    hash |= 0;
  }

  const absHash = Math.abs(hash);
  const { believePct, copePct } = getVotePercentages(believeCount, copeCount);
  const participants = 180 + (absHash % 1820);
  const volume = 4_200 + (absHash % 76_000);
  const endsAt = new Date(
    Date.now() + MARKET_DURATION_HOURS * 60 * 60 * 1000,
  ).toISOString();

  const startBelievePct = Math.max(
    12,
    Math.min(88, believePct + ((absHash % 17) - 8)),
  );
  const convictionHistory: ConvictionPoint[] = Array.from(
    { length: 12 },
    (_, index) => {
      const progress = index / 11;
      const believePctAtPoint = Math.round(
        startBelievePct + (believePct - startBelievePct) * progress,
      );
      return {
        offsetMins: index * (MARKET_DURATION_HOURS * 60) / 11,
        believePct: believePctAtPoint,
      };
    },
  );

  convictionHistory[convictionHistory.length - 1] = {
    offsetMins: convictionHistory[convictionHistory.length - 1].offsetMins,
    believePct,
  };

  return {
    believePct,
    copePct,
    participants,
    volume,
    endsAt,
    durationHours: MARKET_DURATION_HOURS,
    convictionHistory,
  };
}

export function formatMarketVolume(volume: number): string {
  if (volume >= 1_000) {
    return `${(volume / 1_000).toFixed(1)}k`;
  }
  return String(volume);
}

export function formatTimeRemaining(endsAt: string, now = Date.now()): string {
  const diffMs = new Date(endsAt).getTime() - now;
  if (diffMs <= 0) return "Closed";

  const totalMins = Math.floor(diffMs / 60_000);
  const hours = Math.floor(totalMins / 60);
  const mins = totalMins % 60;

  if (hours >= 24) {
    const days = Math.floor(hours / 24);
    const remHours = hours % 24;
    return `${days}d ${remHours}h`;
  }

  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}

export function getDefaultEntrySize(): number {
  return DEFAULT_ENTRY_SIZE;
}

export function getIncreaseSize(): number {
  return INCREASE_SIZE;
}

export function shouldShowMarketUnavailableNote(input: {
  market?: MarketSnapshot;
  userVote: unknown;
  belief: string;
}): boolean {
  return !input.market && input.userVote != null && !shouldAttachMarket(input.belief);
}
