import type { MarketStatus } from "@/lib/markets/types";
import {
  getCurrentSeason,
  getSeasonById,
  type Season,
  type SeasonId,
} from "@/lib/seasons";

export const SEASON_1_LAUNCH_MARKET_COUNT = 10;

export type SeasonCurationMarketInput = {
  id: string;
  seasonId: string;
  status: MarketStatus;
  displayOrder: number | null;
  treasuryConvictionCope: number;
  resolutionCriteria: string;
  closesAt: string;
  createdAt: string;
};

export type SeasonLaunchReport = {
  seasonId: string;
  seasonName: string;
  launchMarketTarget: number;
  publicLaunchMarkets: number;
  orderedMarkets: number;
  treasuryConvictionSet: number;
  resolutionCriteriaSet: number;
  futureCloseTimeSet: number;
  publishedOpenMarkets: number;
  draftMarkets: number;
  duplicateDisplayOrders: number[];
  missingDisplayOrders: number[];
  hasExactlyTenLaunchMarkets: boolean;
  isLaunchReady: boolean;
};

export function getSeasonMarketId(seasonId: SeasonId): string {
  return `season-${seasonId}`;
}

export function getCurrentSeasonMarketId(): string {
  return getSeasonMarketId(getCurrentSeason().id);
}

export function getSeasonNameForMarketId(seasonMarketId: string): string {
  const match = /^season-(\d+)$/.exec(seasonMarketId.trim());
  if (!match) return seasonMarketId;

  const id = Number(match[1]) as SeasonId;
  return getSeasonById(id)?.name ?? seasonMarketId;
}

export function parseSeasonMarketId(value: unknown): string {
  if (typeof value !== "string") {
    throw new Error("Season ID is required.");
  }

  const trimmed = value.trim();
  if (!/^season-[1-9]\d*$/.test(trimmed)) {
    throw new Error("Season ID must be like season-1.");
  }

  return trimmed;
}

export function parseDisplayOrder(value: unknown): number | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  if (typeof value === "number") {
    if (!Number.isInteger(value) || value <= 0) {
      throw new Error("Display order must be a positive whole number.");
    }
    return value;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return null;

    if (!/^\d+$/.test(trimmed)) {
      throw new Error("Display order must be a positive whole number.");
    }

    const parsed = Number(trimmed);
    if (!Number.isSafeInteger(parsed) || parsed <= 0) {
      throw new Error("Display order must be a positive whole number.");
    }

    return parsed;
  }

  throw new Error("Display order must be a positive whole number.");
}

export function parseIsFeatured(value: unknown): boolean {
  if (typeof value === "boolean") return value;
  if (value === "true" || value === 1) return true;
  if (value === "false" || value === 0 || value === null || value === undefined) {
    return false;
  }
  throw new Error("Featured must be true or false.");
}

export function isPublicLaunchMarketStatus(status: MarketStatus): boolean {
  return status === "open" || status === "closed" || status === "resolved";
}

export function analyzeSeasonLaunch(
  markets: SeasonCurationMarketInput[],
  seasonId: string,
  launchMarketTarget: number = SEASON_1_LAUNCH_MARKET_COUNT,
): SeasonLaunchReport {
  const seasonMarkets = markets.filter((market) => market.seasonId === seasonId);
  const publicLaunch = seasonMarkets.filter((market) =>
    isPublicLaunchMarketStatus(market.status),
  );
  const ordered = seasonMarkets.filter((market) => market.displayOrder !== null);
  const treasurySet = seasonMarkets.filter(
    (market) => market.treasuryConvictionCope > 0,
  );
  const criteriaSet = seasonMarkets.filter(
    (market) => market.resolutionCriteria.trim().length > 0,
  );
  const futureClose = seasonMarkets.filter(
    (market) =>
      market.status !== "voided" &&
      market.closesAt &&
      new Date(market.closesAt).getTime() > Date.now(),
  );
  const openMarkets = seasonMarkets.filter((market) => market.status === "open");
  const draftMarkets = seasonMarkets.filter((market) => market.status === "draft");

  const orderCounts = new Map<number, number>();
  for (const market of seasonMarkets) {
    if (market.displayOrder === null) continue;
    orderCounts.set(
      market.displayOrder,
      (orderCounts.get(market.displayOrder) ?? 0) + 1,
    );
  }

  const duplicateDisplayOrders = [...orderCounts.entries()]
    .filter(([, count]) => count > 1)
    .map(([order]) => order)
    .sort((a, b) => a - b);

  const assignedOrders = new Set(
    seasonMarkets
      .map((market) => market.displayOrder)
      .filter((order): order is number => order !== null),
  );
  const missingDisplayOrders: number[] = [];
  for (let order = 1; order <= launchMarketTarget; order += 1) {
    if (!assignedOrders.has(order)) {
      missingDisplayOrders.push(order);
    }
  }

  const hasExactlyTenLaunchMarkets = publicLaunch.length === launchMarketTarget;

  return {
    seasonId,
    seasonName: getSeasonNameForMarketId(seasonId),
    launchMarketTarget,
    publicLaunchMarkets: publicLaunch.length,
    orderedMarkets: ordered.length,
    treasuryConvictionSet: treasurySet.length,
    resolutionCriteriaSet: criteriaSet.length,
    futureCloseTimeSet: futureClose.length,
    publishedOpenMarkets: openMarkets.length,
    draftMarkets: draftMarkets.length,
    duplicateDisplayOrders,
    missingDisplayOrders,
    hasExactlyTenLaunchMarkets,
    isLaunchReady:
      hasExactlyTenLaunchMarkets &&
      duplicateDisplayOrders.length === 0 &&
      missingDisplayOrders.length === 0 &&
      treasurySet.length >= launchMarketTarget &&
      criteriaSet.length >= launchMarketTarget &&
      futureClose.length >= launchMarketTarget,
  };
}

export function comparePublicMarketCuration<
  T extends {
    seasonId: string;
    displayOrder: number | null;
    isFeatured: boolean;
    createdAt: string;
  },
>(a: T, b: T, currentSeasonId: string = getCurrentSeasonMarketId()): number {
  const aCurrent = a.seasonId === currentSeasonId ? 0 : 1;
  const bCurrent = b.seasonId === currentSeasonId ? 0 : 1;
  if (aCurrent !== bCurrent) return aCurrent - bCurrent;

  if (a.isFeatured !== b.isFeatured) {
    return a.isFeatured ? -1 : 1;
  }

  const aOrder = a.displayOrder ?? Number.MAX_SAFE_INTEGER;
  const bOrder = b.displayOrder ?? Number.MAX_SAFE_INTEGER;
  if (aOrder !== bOrder) return aOrder - bOrder;

  return Date.parse(b.createdAt) - Date.parse(a.createdAt);
}

export function getDefaultSeasonForNewMarket(season: Season = getCurrentSeason()): string {
  return getSeasonMarketId(season.id);
}
