export type MockProfilePosition = {
  id: string;
  marketTitle: string;
  side: "believe" | "cope";
  stakeAmount: number;
  status: "open" | "won" | "lost";
};

export type MockProfileNote = {
  id: string;
  marketTitle: string;
  side: "believe" | "cope";
  body: string;
  createdAt: string;
};

export type MockProfileBelief = {
  id: string;
  text: string;
  roomSlug: string;
};

export type MockProfile = {
  username: string;
  initials: string;
  bio: string;
  seasonRank: number;
  seasonPoints: number;
  copeCredits: number;
  winRate: number;
  marketsEntered: number;
  marketsWon: number;
  activePositions: MockProfilePosition[];
  recentConvictionNotes: MockProfileNote[];
  beliefsCreated: MockProfileBelief[];
};

const MOCK_PROFILES: MockProfile[] = [
  {
    username: "MasonSignal",
    initials: "MS",
    bio: "Trades the contradiction before the consensus notices it.",
    seasonRank: 1,
    seasonPoints: 18420,
    copeCredits: 128400,
    winRate: 72,
    marketsEntered: 39,
    marketsWon: 28,
    activePositions: [
      {
        id: "ms-pos-1",
        marketTitle: "Will AI replace most junior engineers?",
        side: "believe",
        stakeAmount: 1200,
        status: "open",
      },
      {
        id: "ms-pos-2",
        marketTitle: "Will taste be the last human advantage?",
        side: "cope",
        stakeAmount: 850,
        status: "open",
      },
    ],
    recentConvictionNotes: [
      {
        id: "ms-note-1",
        marketTitle: "Will AI replace most junior engineers?",
        side: "believe",
        body: "The room is underestimating how fast onboarding work gets automated.",
        createdAt: "24m ago",
      },
      {
        id: "ms-note-2",
        marketTitle: "Will taste be the last human advantage?",
        side: "cope",
        body: "Taste still compounds through distribution, not just judgment.",
        createdAt: "2h ago",
      },
    ],
    beliefsCreated: [
      {
        id: "ms-belief-1",
        text: "AI will replace most junior engineers",
        roomSlug: "ai-will-replace-most-junior-engineers-2mkt",
      },
    ],
  },
  {
    username: "SwarmMaxi",
    initials: "CM",
    bio: "High conviction, low patience, always checking the pool split.",
    seasonRank: 2,
    seasonPoints: 17110,
    copeCredits: 111250,
    winRate: 68,
    marketsEntered: 42,
    marketsWon: 29,
    activePositions: [
      {
        id: "cm-pos-1",
        marketTitle: "Will crypto matter more than AI agents?",
        side: "believe",
        stakeAmount: 980,
        status: "open",
      },
    ],
    recentConvictionNotes: [
      {
        id: "cm-note-1",
        marketTitle: "Will crypto matter more than AI agents?",
        side: "believe",
        body: "Agents need rails. Crypto is still the cleanest settlement layer.",
        createdAt: "37m ago",
      },
    ],
    beliefsCreated: [
      {
        id: "cm-belief-1",
        text: "Crypto will matter more than AI agents",
        roomSlug: "crypto-will-matter-more-than-ai-agents-2mkt",
      },
    ],
  },
  {
    username: "ContrarianCat",
    initials: "CC",
    bio: "Fades obvious narratives and occasionally lands on all four feet.",
    seasonRank: 3,
    seasonPoints: 15980,
    copeCredits: 98700,
    winRate: 65,
    marketsEntered: 37,
    marketsWon: 24,
    activePositions: [
      {
        id: "cc-pos-1",
        marketTitle: "Will remote work be better for deep focus?",
        side: "cope",
        stakeAmount: 760,
        status: "open",
      },
    ],
    recentConvictionNotes: [
      {
        id: "cc-note-1",
        marketTitle: "Will remote work be better for deep focus?",
        side: "cope",
        body: "Focus is real, but coordination debt is being ignored.",
        createdAt: "1h ago",
      },
    ],
    beliefsCreated: [
      {
        id: "cc-belief-1",
        text: "Remote work is better for deep focus",
        roomSlug: "remote-work-is-better-for-deep-focus-0mkt",
      },
    ],
  },
  {
    username: "BeliefHunter",
    initials: "BH",
    bio: "Finds rooms with weak assumptions and turns them into points.",
    seasonRank: 4,
    seasonPoints: 14260,
    copeCredits: 91400,
    winRate: 61,
    marketsEntered: 35,
    marketsWon: 21,
    activePositions: [
      {
        id: "bh-pos-1",
        marketTitle: "Will most startups avoid venture?",
        side: "believe",
        stakeAmount: 640,
        status: "open",
      },
    ],
    recentConvictionNotes: [
      {
        id: "bh-note-1",
        marketTitle: "Will most startups avoid venture?",
        side: "believe",
        body: "Distribution got cheaper, but investor expectations did not.",
        createdAt: "3h ago",
      },
    ],
    beliefsCreated: [
      {
        id: "bh-belief-1",
        text: "Most startups should not raise venture",
        roomSlug: "most-startups-should-not-raise-venture-0mkt",
      },
    ],
  },
  {
    username: "VoidTrader",
    initials: "VT",
    bio: "Comfortable holding positions that look wrong until they do not.",
    seasonRank: 5,
    seasonPoints: 13140,
    copeCredits: 87550,
    winRate: 58,
    marketsEntered: 34,
    marketsWon: 20,
    activePositions: [
      {
        id: "vt-pos-1",
        marketTitle: "Will social apps become agent feeds?",
        side: "believe",
        stakeAmount: 520,
        status: "open",
      },
    ],
    recentConvictionNotes: [
      {
        id: "vt-note-1",
        marketTitle: "Will social apps become agent feeds?",
        side: "believe",
        body: "People already consume through algorithms. Agents are the next interface.",
        createdAt: "4h ago",
      },
    ],
    beliefsCreated: [
      {
        id: "vt-belief-1",
        text: "Social apps will become agent feeds",
        roomSlug: "social-apps-will-become-agent-feeds-2mkt",
      },
    ],
  },
  {
    username: "OrangePill",
    initials: "OP",
    bio: "Backs the orange side of the take, unless the pool gets silly.",
    seasonRank: 6,
    seasonPoints: 11920,
    copeCredits: 80200,
    winRate: 56,
    marketsEntered: 31,
    marketsWon: 17,
    activePositions: [
      {
        id: "op-pos-1",
        marketTitle: "Will taste be the last human advantage?",
        side: "believe",
        stakeAmount: 480,
        status: "open",
      },
    ],
    recentConvictionNotes: [
      {
        id: "op-note-1",
        marketTitle: "Will taste be the last human advantage?",
        side: "believe",
        body: "Taste is a networked edge. Tools make it more valuable, not less.",
        createdAt: "5h ago",
      },
    ],
    beliefsCreated: [
      {
        id: "op-belief-1",
        text: "Taste is the last human advantage",
        roomSlug: "taste-is-the-last-human-advantage-2mkt",
      },
    ],
  },
  {
    username: "Alex",
    initials: "A",
    bio: "Building a conviction profile one tested belief at a time.",
    seasonRank: 7,
    seasonPoints: 10780,
    copeCredits: 74200,
    winRate: 54,
    marketsEntered: 28,
    marketsWon: 15,
    activePositions: [
      {
        id: "alex-pos-1",
        marketTitle: "Will remote work be better for deep focus?",
        side: "believe",
        stakeAmount: 420,
        status: "open",
      },
      {
        id: "alex-pos-2",
        marketTitle: "Will social apps become agent feeds?",
        side: "cope",
        stakeAmount: 260,
        status: "open",
      },
    ],
    recentConvictionNotes: [
      {
        id: "alex-note-1",
        marketTitle: "Will remote work be better for deep focus?",
        side: "believe",
        body: "Deep work improves when interruptions become explicit instead of ambient.",
        createdAt: "18m ago",
      },
      {
        id: "alex-note-2",
        marketTitle: "Will social apps become agent feeds?",
        side: "cope",
        body: "Agents may curate feeds, but people still want visible human taste.",
        createdAt: "6h ago",
      },
    ],
    beliefsCreated: [
      {
        id: "alex-belief-1",
        text: "Remote work is better for deep focus",
        roomSlug: "remote-work-is-better-for-deep-focus-0mkt",
      },
    ],
  },
  {
    username: "TheoWasRight",
    initials: "TW",
    bio: "Temporary conviction only. Never a lifetime take.",
    seasonRank: 8,
    seasonPoints: 9640,
    copeCredits: 68100,
    winRate: 51,
    marketsEntered: 26,
    marketsWon: 13,
    activePositions: [
      {
        id: "tw-pos-1",
        marketTitle: "Will most startups avoid venture?",
        side: "cope",
        stakeAmount: 300,
        status: "open",
      },
    ],
    recentConvictionNotes: [
      {
        id: "tw-note-1",
        marketTitle: "Will most startups avoid venture?",
        side: "cope",
        body: "The venture model survives because ambition keeps expanding.",
        createdAt: "8h ago",
      },
    ],
    beliefsCreated: [
      {
        id: "tw-belief-1",
        text: "Most startups should not raise venture",
        roomSlug: "most-startups-should-not-raise-venture-0mkt",
      },
    ],
  },
];

export function getMockProfiles(): MockProfile[] {
  return MOCK_PROFILES;
}

export function normalizeProfileUsername(username: string): string {
  return username.trim().toLowerCase();
}

export function getMockProfile(username: string): MockProfile | null {
  const normalized = normalizeProfileUsername(username);
  return (
    MOCK_PROFILES.find(
      (profile) => normalizeProfileUsername(profile.username) === normalized,
    ) ?? null
  );
}

export function getMockProfilePath(username: string): string {
  return `/u/${encodeURIComponent(username)}`;
}
