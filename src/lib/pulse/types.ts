export type PulseLifecycleState =
  | "draft"
  | "ready"
  | "running"
  | "paused"
  | "pausing"
  | "settling"
  | "errored"
  | "disabled"
  | "archived";

export type PulseHealth =
  | "healthy"
  | "degraded"
  | "offline"
  | "needs_admin_review";

export type PulseRoundStatus =
  | "pending"
  | "open"
  | "locked"
  | "settling"
  | "settled"
  | "cancelled"
  | "errored";

export type PulseWinningSide = "believe" | "cope" | "draw";

export type PulsePositionSide = "believe" | "cope";

export type PulseEngineRow = {
  id: string;
  beliefRoomId: string;
  assetSymbol: string;
  quoteCurrency: string;
  providerAssetId: string;
  displayPair: string;
  lifecycleState: PulseLifecycleState;
  health: PulseHealth;
  pauseAfterCurrent: boolean;
  roundDurationSeconds: number;
  activeRoundId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type PulseRoundRow = {
  id: string;
  engineId: string;
  roundNumber: number;
  status: PulseRoundStatus;
  openedAt: string | null;
  closesAt: string | null;
  settledAt: string | null;
  openingPrice: string | null;
  openingPriceSource: string | null;
  openingPriceAt: string | null;
  closingPrice: string | null;
  closingPriceSource: string | null;
  closingPriceAt: string | null;
  winningSide: PulseWinningSide | null;
  believePool: number;
  copePool: number;
  seedCredits: number;
  createdAt: string;
  updatedAt: string;
};

export type PulsePositionRow = {
  id: string;
  roundId: string;
  engineId: string;
  userId: string | null;
  walletAddress: string | null;
  side: PulsePositionSide;
  stakeAmount: number;
  payoutCredits: number | null;
  isWinner: boolean | null;
  settledAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type PulseRoundSettlementSummary = {
  winningSide: PulseWinningSide;
  totalPool: number;
  winningPool: number;
  losingPool: number;
  positionsSettled: number;
  creditsPaid: number;
};

export type PulsePositionPools = {
  believePool: number;
  copePool: number;
};

export type CreatePulsePositionInput = {
  roundId: string;
  engineId: string;
  userId?: string | null;
  walletAddress?: string | null;
  side: PulsePositionSide;
  stakeAmount: number;
};
