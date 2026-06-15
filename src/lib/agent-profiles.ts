import type { ChatMessage } from "@/components/debate-chat";

export type AgentSlug = "mason" | "victor" | "logan" | "theo";

export type AgentProfile = {
  slug: AgentSlug;
  name: string;
  role: string;
  quote: string;
  description: string;
};

const GUEST_DISPLAY_NAME = "You";

const GUEST = (id: string, text: string): ChatMessage => ({
  id,
  author: GUEST_DISPLAY_NAME,
  text,
  isUser: true,
});

const AGENT = (id: string, author: string, text: string): ChatMessage => ({
  id,
  author,
  text,
});

export const AGENT_PROFILES: AgentProfile[] = [
  {
    slug: "mason",
    name: "Mason",
    role: "Opportunist",
    quote: "I see opportunity before everyone else.",
    description:
      "Spots upside early. Pushes back when a belief ignores second-order effects.",
  },
  {
    slug: "victor",
    name: "Victor",
    role: "Contrarian",
    quote: "I question consensus.",
    description:
      "Attacks weak premises. Thinks the crowd is usually coping, not thinking.",
  },
  {
    slug: "logan",
    name: "Logan",
    role: "Builder",
    quote: "I care about products, users and execution.",
    description:
      "Grounds debate in reality. Asks whether anyone would actually use or pay for this.",
  },
  {
    slug: "theo",
    name: "Theo",
    role: "Analyst",
    quote: "I focus on evidence and probability.",
    description:
      "Runs on data and base rates. Believes most convictions should have an expiry date.",
  },
];

const PROFILE_CONVERSATIONS: Record<AgentSlug, ChatMessage[]> = {
  mason: [
    GUEST("mason-1", "who are you?"),
    AGENT(
      "mason-2",
      "Mason",
      "Mason. I hunt upside before the narrative catches up.",
    ),
    GUEST("mason-3", "what do you believe?"),
    AGENT(
      "mason-4",
      "Mason",
      "Every belief has a trade on the other side. Most people ignore that.",
    ),
    GUEST("mason-5", "what annoys you?"),
    AGENT(
      "mason-6",
      "Mason",
      "Timelines that pretend second-order effects don't exist.",
    ),
    GUEST("mason-7", "what are you often right about?"),
    AGENT(
      "mason-8",
      "Mason",
      "Where the crowd is late and the upside is still open.",
    ),
    GUEST("mason-9", "what's your weakness?"),
    AGENT(
      "mason-10",
      "Mason",
      "I sometimes see opportunity where there isn't any. Yet.",
    ),
  ],
  victor: [
    GUEST("victor-1", "who are you?"),
    AGENT("victor-2", "Victor", "Victor. Professional skeptic."),
    GUEST("victor-3", "what do you believe?"),
    AGENT(
      "victor-4",
      "Victor",
      "Consensus is usually a coping mechanism.",
    ),
    GUEST("victor-5", "what annoys you?"),
    AGENT(
      "victor-6",
      "Victor",
      "Everyone agreeing too fast. That's not thinking — that's group therapy.",
    ),
    GUEST("victor-7", "what are you often right about?"),
    AGENT(
      "victor-8",
      "Victor",
      "The premise was shaky from the start.",
    ),
    GUEST("victor-9", "what's your weakness?"),
    AGENT(
      "victor-10",
      "Victor",
      "I can argue past the point where I'm actually wrong.",
    ),
  ],
  logan: [
    GUEST("logan-1", "who are you?"),
    AGENT(
      "logan-2",
      "Logan",
      "Logan. I build things people actually use.",
    ),
    GUEST("logan-3", "what do you believe?"),
    AGENT(
      "logan-4",
      "Logan",
      "A belief nobody would pay for is just a vibe.",
    ),
    GUEST("logan-5", "what annoys you?"),
    AGENT(
      "logan-6",
      "Logan",
      "Grand theories with no product, no users, no ship date.",
    ),
    GUEST("logan-7", "what are you often right about?"),
    AGENT(
      "logan-8",
      "Logan",
      "Whether something survives contact with reality.",
    ),
    GUEST("logan-9", "what's your weakness?"),
    AGENT(
      "logan-10",
      "Logan",
      "I dismiss ideas too early when the product isn't obvious yet.",
    ),
  ],
  theo: [
    GUEST("theo-1", "who are you?"),
    AGENT(
      "theo-2",
      "Theo",
      "Theo. I run on evidence and base rates.",
    ),
    GUEST("theo-3", "what do you believe?"),
    AGENT(
      "theo-4",
      "Theo",
      "Most convictions should have an expiry date.",
    ),
    GUEST("theo-5", "what annoys you?"),
    AGENT(
      "theo-6",
      "Theo",
      "Confidence without probability. Certainty without data.",
    ),
    GUEST("theo-7", "what are you often right about?"),
    AGENT(
      "theo-8",
      "Theo",
      "How unlikely the confident take actually is.",
    ),
    GUEST("theo-9", "what's your weakness?"),
    AGENT(
      "theo-10",
      "Theo",
      "I underweight conviction when the data is thin but the insight is real.",
    ),
  ],
};

function formatAgentIntro(profile: AgentProfile): string {
  return `${profile.name} · ${profile.role}\n\n${profile.quote}\n\n${profile.description}`;
}

export function getAgentsOverviewConversation(): ChatMessage[] {
  const messages: ChatMessage[] = [
    GUEST("agents-1", "who are the agents?"),
    AGENT(
      "agents-2",
      "Cope Engine",
      "Four personalities. Each one stress-tests a different angle of your belief.",
    ),
  ];

  for (const profile of AGENT_PROFILES) {
    messages.push(
      GUEST(`agents-${profile.slug}-q`, `who is ${profile.slug}?`),
      AGENT(
        `agents-${profile.slug}-a`,
        profile.name,
        formatAgentIntro(profile),
      ),
    );
  }

  messages.push(
    GUEST("agents-close-q", "do they ever agree?"),
    AGENT(
      "agents-close-a",
      "Cope Engine",
      "Together they run every belief through the room. You bring the claim — they bring the friction.",
    ),
  );

  return messages;
}

export function isAgentSlug(slug: string): slug is AgentSlug {
  return slug in PROFILE_CONVERSATIONS;
}

export function getAgentProfile(slug: string): AgentProfile | null {
  return AGENT_PROFILES.find((profile) => profile.slug === slug) ?? null;
}

export function getAgentConversation(slug: AgentSlug): ChatMessage[] {
  return PROFILE_CONVERSATIONS[slug];
}

export function getAgentProfilePath(agentName: string): string | null {
  const profile = AGENT_PROFILES.find((entry) => entry.name === agentName);
  return profile ? `/agents/${profile.slug}` : null;
}
