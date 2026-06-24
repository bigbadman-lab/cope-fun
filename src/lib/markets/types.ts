export type MarketStatus = "draft" | "open" | "closed" | "resolved" | "voided";
export type MarketSide = "believe" | "cope";

export type PublicMarketStatus = Exclude<MarketStatus, "draft">;

export type PublicMarket = {
  id: string;
  roomId: string;
  roomSlug: string;
  roomBelief: string;
  title: string;
  resolutionCriteria: string;
  resolutionSource: string | null;
  status: PublicMarketStatus;
  opensAt: string | null;
  closesAt: string;
  resolvesAt: string | null;
  outcome: MarketSide | null;
  resolvedAt: string | null;
  resolutionNotes: string | null;
  believePool: number;
  copePool: number;
  participantCount: number;
};

export type MarketPositionView = {
  id: string;
  side: MarketSide;
  stakeCredits: number;
  payoutCredits: number | null;
  isWinner: boolean | null;
  settledAt: string | null;
};

export type CreditAccountView = {
  balanceCredits: number;
  seasonPoints: number;
  totalStakedCredits: number;
  totalWonCredits: number;
  totalLostCredits: number;
  marketsEntered: number;
  marketsWon: number;
  marketsLost: number;
};

export type RoomMarketView = PublicMarket & {
  userPosition: MarketPositionView | null;
  userAccount: CreditAccountView | null;
};

export type LeaderboardEntry = {
  rank: number;
  anonymousSessionId: string;
  label: string;
  balanceCredits: number;
  totalWonCredits: number;
  marketsEntered: number;
  marketsWon: number;
  marketsLost: number;
};

export const ALLOWED_STAKE_AMOUNTS = [10, 25, 50, 100, 250] as const;
export type StakeAmount = (typeof ALLOWED_STAKE_AMOUNTS)[number];

export type AdminMarketCandidate = {
  roomId: string;
  slug: string;
  belief: string;
  createdAt: string;
  challengeCount: number;
};

export type AdminMarketRow = {
  id: string;
  roomId: string;
  roomSlug: string;
  roomBelief: string;
  title: string;
  resolutionCriteria: string;
  resolutionSource: string | null;
  status: MarketStatus;
  opensAt: string | null;
  closesAt: string;
  resolvesAt: string | null;
  outcome: MarketSide | null;
  resolvedAt: string | null;
  resolutionNotes: string | null;
  believePool: number;
  copePool: number;
  participantCount: number;
};

export type AdminMarketsData = {
  candidates: AdminMarketCandidate[];
  drafts: AdminMarketRow[];
  open: AdminMarketRow[];
  closed: AdminMarketRow[];
  terminal: AdminMarketRow[];
};
