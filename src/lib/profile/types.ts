import type { MarketDisplayStatus } from "@/lib/markets/display-status";
import type { MarketSide, MarketStatus } from "@/lib/markets/types";

export type ProfileUserSummary = {
  id: string;
  displayName: string | null;
  walletAddress: string | null;
  rewardsWalletSource: "connected" | "embedded" | "unknown" | null;
  email: string | null;
  label: string;
  linkedAnonymousSessionId: string | null;
  avatarColor: string | null;
  avatarUrl: string | null;
  avatarPublicUrl: string | null;
  avatarUpdatedAt: string | null;
};

export type ProfileSeasonSummary = {
  name: string;
  rank: number | null;
  totalPlayers: number;
  isQualified: boolean;
  qualificationMessage: string | null;
  eligibilityNote: string;
};

export type ProfileAccountSummary = {
  balanceCredits: number;
  seasonPoints: number;
  totalWonCredits: number;
  totalStakedCredits: number;
  totalLostCredits: number;
  marketsEntered: number;
  marketsWon: number;
  marketsLost: number;
  winRate: number | null;
};

export type ProfileMarketPositionSummary = {
  id: string;
  marketId: string;
  marketTitle: string;
  marketStatus: MarketStatus;
  displayStatus: MarketDisplayStatus;
  roomSlug: string;
  roomBelief: string;
  side: MarketSide;
  stakeCredits: number;
  payoutCredits: number | null;
  isWinner: boolean | null;
  closesAt: string;
  resolvedAt: string | null;
  outcome: MarketSide | null;
  createdAt: string;
  pnl: number | null;
};

export type ProfileCreatedRoomSummary = {
  id: string;
  slug: string;
  belief: string;
  createdAt: string;
  isHidden: boolean;
  status: "published" | "hidden";
};

export type ProfileDashboard = {
  user: ProfileUserSummary;
  season: ProfileSeasonSummary;
  account: ProfileAccountSummary;
  activePositions: ProfileMarketPositionSummary[];
  resolvedPositions: ProfileMarketPositionSummary[];
  createdRooms: ProfileCreatedRoomSummary[];
};
