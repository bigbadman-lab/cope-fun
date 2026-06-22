import type { ConvictionNote, Market, MarketSide } from "@/lib/market-types";

const MARKET_ROOM_SLUGS = [
  "ai-will-replace-most-junior-engineers-2mkt",
  "remote-work-is-better-for-deep-focus-0mkt",
  "crypto-will-matter-more-than-ai-agents-2mkt",
  "taste-is-the-last-human-advantage-2mkt",
  "most-startups-should-not-raise-venture-0mkt",
  "social-apps-will-become-agent-feeds-2mkt",
] as const;

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function sideFromHash(hash: number): MarketSide {
  return hash % 2 === 0 ? "believe" : "cope";
}

function getMarketTitleFromSlug(slug: string): string {
  const words = slug
    .replace(/-[a-z0-9]{4,8}$/i, "")
    .split("-")
    .filter(Boolean);
  const title = words
    .map((word) => (word === "ai" ? "AI" : word))
    .join(" ");

  return title ? `Will "${title}" hold up?` : "Will this belief hold up?";
}

function createNote(input: {
  marketId: string;
  index: number;
  hash: number;
  side: MarketSide;
  stakeAmount: number;
  body: string;
  createdAt: string;
}): ConvictionNote {
  const users = ["Mason", "Victor", "Logan", "Theo", "Avery"];
  return {
    id: `${input.marketId}:note-${input.index}`,
    marketId: input.marketId,
    userName: users[(input.hash + input.index) % users.length],
    side: input.side,
    stakeAmount: input.stakeAmount,
    body: input.body,
    createdAt: input.createdAt,
  };
}

export function getMockMarketForRoom(slug: string): Market | null {
  const hash = hashString(slug);
  if (hash % 3 !== 0) return null;

  const marketId = `mock-market:${slug}`;
  const believePool = 420 + (hash % 900);
  const copePool = 320 + ((hash >> 3) % 760);
  const now = Date.now();
  const closesAt = new Date(now + (18 + (hash % 42)) * 60 * 60 * 1000).toISOString();
  const resolvesAt = new Date(
    new Date(closesAt).getTime() + 12 * 60 * 60 * 1000,
  ).toISOString();

  const firstSide = sideFromHash(hash);
  const secondSide: MarketSide = firstSide === "believe" ? "cope" : "believe";

  const notes: ConvictionNote[] = [
    createNote({
      marketId,
      index: 1,
      hash,
      side: firstSide,
      stakeAmount: 75 + (hash % 80),
      body:
        firstSide === "believe"
          ? "The agents found weak spots, but the core claim still has enough signal to back."
          : "The debate exposed too many assumptions. I am fading the original conviction.",
      createdAt: new Date(now - 26 * 60 * 1000).toISOString(),
    }),
    createNote({
      marketId,
      index: 2,
      hash,
      side: secondSide,
      stakeAmount: 50 + ((hash >> 2) % 95),
      body:
        secondSide === "believe"
          ? "Temporary conviction only, but I think the room is underpricing the upside."
          : "This feels more like narrative momentum than something durable.",
      createdAt: new Date(now - 7 * 60 * 1000).toISOString(),
    }),
  ];

  return {
    id: marketId,
    roomSlug: slug,
    title: getMarketTitleFromSlug(slug),
    resolutionCriteria:
      "Resolves from the final room outcome and admin review of whether the original belief remained defensible.",
    status: "open",
    closesAt,
    resolvesAt,
    believePool,
    copePool,
    totalPool: believePool + copePool,
    notes,
  };
}

export function hasMockMarketForRoom(slug: string): boolean {
  return getMockMarketForRoom(slug) != null;
}

export function getMockMarkets(): Market[] {
  return MARKET_ROOM_SLUGS.map(getMockMarketForRoom).filter(
    (market): market is Market => market != null,
  );
}
