import "server-only";

import {
  getActivePulseRound,
  getLatestPulseRound,
  getPulseEngineByBeliefRoomId,
} from "@/lib/db/pulse";
import {
  resolveSolUsdPrice,
  SolUsdPriceStaleError,
  SolUsdPriceUnavailableError,
} from "@/lib/prices/resolve-sol-usd-price";
import type {
  PulseEngineRow,
  PulseHealth,
  PulseLifecycleState,
  PulseRoundRow,
  PulseRoundStatus,
  PulseWinningSide,
} from "@/lib/pulse/types";
import { isPulseRunnerEnabled } from "@/lib/pulse/runner";

export type PulseAdminStatus = {
  engine: PulseEngineRow | null;
  round: PulseRoundRow | null;
};

export type PulsePublicEngineView = {
  id: string;
  beliefRoomId: string;
  displayPair: string;
  lifecycleState: PulseLifecycleState;
  health: PulseHealth;
  roundDurationSeconds: number;
};

export type PulsePublicRoundView = {
  id: string;
  roundNumber: number;
  status: PulseRoundStatus;
  openedAt: string | null;
  closesAt: string | null;
  settledAt: string | null;
  openingPrice: number | null;
  openingPriceSource: string | null;
  closingPrice: number | null;
  winningSide: PulseWinningSide | null;
  believePool: number;
  copePool: number;
  totalPool: number;
  believePercent: number;
  copePercent: number;
};

export type PulsePublicLivePriceView = {
  price: number | null;
  source: "websocket" | "rest_fallback" | null;
  updatedAt: string | null;
  connectionStatus: string;
  priceAgeMs: number | null;
  priceStatus: "ok" | "unavailable" | "stale" | null;
};

export type PulsePublicDerivedView = {
  secondsRemaining: number | null;
  isOpen: boolean;
  isClosed: boolean;
  currentlyWinningSide: PulseWinningSide | null;
};

export type PulsePublicAutomationView = {
  runnerEnabled: boolean;
  willOpenNextRoundAutomatically: boolean;
};

export type PulsePublicStatus = {
  engine: PulsePublicEngineView;
  round: PulsePublicRoundView | null;
  livePrice: PulsePublicLivePriceView;
  derived: PulsePublicDerivedView;
  automation: PulsePublicAutomationView;
};

const FINALIZED_ROUND_STATUSES = new Set<PulseRoundStatus>([
  "locked",
  "settling",
  "settled",
]);

async function loadPulseEngineAndRound(beliefRoomId: string): Promise<{
  engine: PulseEngineRow | null;
  round: PulseRoundRow | null;
}> {
  const engine = await getPulseEngineByBeliefRoomId(beliefRoomId);
  if (!engine) {
    return { engine: null, round: null };
  }

  const activeRound = engine.activeRoundId
    ? await getActivePulseRound(engine.id)
    : null;
  const round = activeRound ?? (await getLatestPulseRound(engine.id));

  return { engine, round };
}

export async function getPulseAdminStatus(
  beliefRoomId: string,
): Promise<PulseAdminStatus> {
  return loadPulseEngineAndRound(beliefRoomId);
}

function parseStoredPrice(value: string | null): number | null {
  if (value === null) {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function poolPercent(part: number, total: number): number {
  if (total <= 0) {
    return 0;
  }

  return Math.round((part / total) * 10000) / 100;
}

function toPublicEngineView(engine: PulseEngineRow): PulsePublicEngineView {
  return {
    id: engine.id,
    beliefRoomId: engine.beliefRoomId,
    displayPair: engine.displayPair,
    lifecycleState: engine.lifecycleState,
    health: engine.health,
    roundDurationSeconds: engine.roundDurationSeconds,
  };
}

function toPublicRoundView(round: PulseRoundRow): PulsePublicRoundView {
  const totalPool = round.believePool + round.copePool;

  return {
    id: round.id,
    roundNumber: round.roundNumber,
    status: round.status,
    openedAt: round.openedAt,
    closesAt: round.closesAt,
    settledAt: round.settledAt,
    openingPrice: parseStoredPrice(round.openingPrice),
    openingPriceSource: round.openingPriceSource,
    closingPrice: parseStoredPrice(round.closingPrice),
    winningSide: round.winningSide,
    believePool: round.believePool,
    copePool: round.copePool,
    totalPool,
    believePercent: poolPercent(round.believePool, totalPool),
    copePercent: poolPercent(round.copePool, totalPool),
  };
}

function computeSecondsRemaining(closesAt: string | null): number | null {
  if (!closesAt) {
    return null;
  }

  const closesAtMs = Date.parse(closesAt);
  if (!Number.isFinite(closesAtMs)) {
    return null;
  }

  return Math.max(0, Math.floor((closesAtMs - Date.now()) / 1000));
}

function isRoundPastClose(closesAt: string | null): boolean {
  if (!closesAt) {
    return false;
  }

  const closesAtMs = Date.parse(closesAt);
  return Number.isFinite(closesAtMs) && Date.now() >= closesAtMs;
}

function computeCurrentlyWinningSide(input: {
  round: PulsePublicRoundView | null;
  livePrice: number | null;
}): PulseWinningSide | null {
  const { round, livePrice } = input;
  if (!round) {
    return null;
  }

  if (
    FINALIZED_ROUND_STATUSES.has(round.status) &&
    round.winningSide !== null
  ) {
    return round.winningSide;
  }

  const openingPrice = round.openingPrice;
  if (livePrice === null || openingPrice === null) {
    return null;
  }

  if (livePrice > openingPrice) {
    return "believe";
  }

  if (livePrice < openingPrice) {
    return "cope";
  }

  return "draw";
}

async function resolvePublicLivePrice(): Promise<PulsePublicLivePriceView> {
  try {
    const resolved = await resolveSolUsdPrice();

    return {
      price: resolved.price,
      source: resolved.source,
      updatedAt: resolved.updatedAt,
      connectionStatus: resolved.connectionStatus,
      priceAgeMs: resolved.priceAgeMs,
      priceStatus: "ok",
    };
  } catch (error) {
    if (error instanceof SolUsdPriceUnavailableError) {
      return {
        price: null,
        source: null,
        updatedAt: null,
        connectionStatus: error.connectionStatus,
        priceAgeMs: null,
        priceStatus: "unavailable",
      };
    }

    if (error instanceof SolUsdPriceStaleError) {
      return {
        price: null,
        source: null,
        updatedAt: error.updatedAt,
        connectionStatus: error.connectionStatus,
        priceAgeMs: error.priceAgeMs,
        priceStatus: "stale",
      };
    }

    return {
      price: null,
      source: null,
      updatedAt: null,
      connectionStatus: "unknown",
      priceAgeMs: null,
      priceStatus: "unavailable",
    };
  }
}

export async function getPulsePublicStatus(
  beliefRoomId: string,
): Promise<PulsePublicStatus | null> {
  const { engine, round } = await loadPulseEngineAndRound(beliefRoomId);
  if (!engine) {
    return null;
  }

  const livePrice = await resolvePublicLivePrice();

  const publicRound = round ? toPublicRoundView(round) : null;
  const pastClose = publicRound ? isRoundPastClose(publicRound.closesAt) : false;
  const isOpen = publicRound?.status === "open" && !pastClose;
  const isClosed =
    publicRound !== null &&
    (pastClose || FINALIZED_ROUND_STATUSES.has(publicRound.status));

  return {
    engine: toPublicEngineView(engine),
    round: publicRound,
    livePrice,
    derived: {
      secondsRemaining: publicRound
        ? computeSecondsRemaining(publicRound.closesAt)
        : null,
      isOpen,
      isClosed,
      currentlyWinningSide: computeCurrentlyWinningSide({
        round: publicRound,
        livePrice: livePrice.price,
      }),
    },
    automation: {
      runnerEnabled: isPulseRunnerEnabled(),
      willOpenNextRoundAutomatically:
        isPulseRunnerEnabled() &&
        engine.lifecycleState === "ready" &&
        !engine.pauseAfterCurrent,
    },
  };
}
