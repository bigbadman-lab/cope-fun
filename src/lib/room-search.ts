export const SEARCH_RESULT_LIMIT = 10;

export type RoomSearchResult = {
  id: string;
  slug: string;
  belief: string;
  url: string;
  roomTitle: string | null;
  searchSummary: string | null;
  createdAt: string;
  challengeCount: number;
  believeCount: number;
  copeCount: number;
  believePct: number;
  copePct: number;
};

export type SearchApiResponse = {
  ok: boolean;
  results?: RoomSearchResult[];
  error?: string;
};

export function formatSearchVoteSummary(result: RoomSearchResult): string {
  const total = result.believeCount + result.copeCount;
  if (total === 0) return "No votes yet";
  return `Believe ${result.believePct}% · Cope ${result.copePct}%`;
}

export function formatSearchChallengeSummary(challengeCount: number): string {
  if (challengeCount === 1) return "1 challenge";
  return `${challengeCount} challenges`;
}
