export type MarketSide = "believe" | "cope";

export type MarketStatus = "open" | "closed" | "resolved" | "voided";

export type MarketPosition = {
  side: MarketSide;
  stakeAmount: number;
  updatedAt: string;
};

export type ConvictionNote = {
  id: string;
  marketId: string;
  userName: string;
  userAvatar?: string;
  side: MarketSide;
  stakeAmount: number;
  body: string;
  createdAt: string;
};

export type Market = {
  id: string;
  roomSlug: string;
  title: string;
  resolutionCriteria: string;
  status: MarketStatus;
  closesAt: string;
  resolvesAt: string;
  believePool: number;
  copePool: number;
  totalPool: number;
  userPosition?: MarketPosition;
  notes: ConvictionNote[];
};
