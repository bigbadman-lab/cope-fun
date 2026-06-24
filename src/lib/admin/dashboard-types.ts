export type AdminRoomSummary = {
  id: string;
  slug: string;
  belief: string;
  createdAt: string;
  challengeCount: number;
  voteCount: number;
  believeCount: number;
  copeCount: number;
  believePct: number;
  copePct: number;
  reactionCount: number;
  isHidden: boolean;
  isFeatured: boolean;
  isMarketCandidate: boolean;
};

export type AdminRoomAction =
  | "hide"
  | "unhide"
  | "feature"
  | "unfeature"
  | "mark_market_candidate"
  | "remove_market_candidate";

export type AdminDashboardData = {
  totals: {
    rooms: number;
    votes: number;
    reactions: number;
    challenges: number;
  };
  recentRooms: AdminRoomSummary[];
  mostVotedRooms: AdminRoomSummary[];
  mostChallengedRooms: AdminRoomSummary[];
  mostReactedRooms: AdminRoomSummary[];
};
