import { AnimatedConversation } from "./animated-conversation";
import { AvatarPlaceholder, USER_DISPLAY_NAME } from "./avatar-placeholder";
import { ChatMessageRow, type ChatMessage } from "./debate-chat";
import {
  ConversationPageLayout,
} from "./conversation-page-layout";
import { TopNav } from "./top-nav";
import { AGENT_PROFILES, type AgentProfile } from "@/lib/agent-profiles";

const GUEST = (id: string, text: string): ChatMessage => ({
  id,
  author: USER_DISPLAY_NAME,
  text,
  isUser: true,
});

const AGENT = (id: string, author: string, text: string): ChatMessage => ({
  id,
  author,
  text,
});

const ABOUT_MESSAGES: ChatMessage[] = [
  GUEST("about-1", "what is cope?"),
  AGENT("about-2", "Cope Engine", "Cope is the internet's belief network."),
  AGENT("about-3", "Mason", "People enter beliefs."),
  AGENT("about-4", "Victor", "Most of them are wrong."),
  AGENT("about-5", "Logan", "The good ones survive debate."),
  AGENT("about-6", "Theo", "The goal isn't truth.\nIt's perspective."),
  AGENT(
    "about-7",
    "Cope Engine",
    "You type a belief. We spin up a room and let the personalities go at it.",
  ),
  AGENT(
    "about-8",
    "Mason",
    "Every claim gets pressure-tested — opportunity, consensus, execution, evidence.",
  ),
  AGENT(
    "about-9",
    "Victor",
    "Agreement is boring. Friction is the product.",
  ),
  AGENT(
    "about-10",
    "Logan",
    "When a debate lands, save the chat. Your rooms live locally for now.",
  ),
  AGENT(
    "about-11",
    "Theo",
    "Eventually — conviction markets. Stake on what you actually believe.",
  ),
  GUEST("about-12", "sounds intense."),
  AGENT(
    "about-13",
    "Cope Engine",
    "That's the point. Enter a belief and see what survives.",
  ),
];

export function AboutPage() {
  return <AnimatedConversation messages={ABOUT_MESSAGES} />;
}

function AgentProfileRow({ profile }: { profile: AgentProfile }) {
  return (
    <div className="-mx-1 rounded-lg px-1">
      <div className="flex gap-2.5">
        <AvatarPlaceholder name={profile.name} />
        <div className="min-w-0 flex-1 pt-0.5">
          <p className="mb-0.5 text-xs font-medium text-zinc-400">
            {profile.name}
          </p>
          <p className="mb-1.5 text-[11px] text-zinc-500">{profile.role}</p>
          <p className="text-[15px] leading-relaxed text-zinc-100">
            {profile.quote}
          </p>
          <p className="mt-1.5 text-sm leading-relaxed text-zinc-500">
            {profile.description}
          </p>
        </div>
      </div>
    </div>
  );
}

export function AgentsPage() {
  return (
    <div className="flex min-h-dvh flex-col">
      <TopNav />
      <main className="flex-1 overflow-y-auto pt-14">
        <div className="mx-auto w-full max-w-md space-y-4 px-4 py-6">
          {AGENT_PROFILES.map((profile, index) => (
            <div key={profile.slug}>
              <ChatMessageRow
                message={GUEST(
                  `agents-${index + 1}`,
                  `who is ${profile.slug}?`,
                )}
                animate={false}
              />
              <AgentProfileRow profile={profile} />
            </div>
          ))}

          <ChatMessageRow
            message={AGENT(
              "agents-5",
              "Cope Engine",
              "Together they run every belief through the room. You bring the claim — they bring the friction.",
            )}
            animate={false}
          />
        </div>
      </main>
    </div>
  );
}

const CONTACT_MESSAGES: ChatMessage[] = [
  GUEST("contact-1", "how do i contact cope?"),
  AGENT(
    "contact-2",
    "Cope Engine",
    "For partnerships, feedback or support:\n\nhello@cope.fun\n\n@copefun",
  ),
];

export function ContactPage() {
  return <ConversationPageLayout messages={CONTACT_MESSAGES} />;
}

export function LegalPage() {
  return (
    <div className="flex min-h-dvh flex-col">
      <TopNav />
      <main className="flex-1 overflow-y-auto pt-14">
        <article className="mx-auto w-full max-w-md px-4 py-8">
          <p className="mb-6 text-xs font-medium uppercase tracking-wide text-amber-500/80">
            MVP placeholder legal copy
          </p>

          <h1 className="mb-8 text-xl font-semibold tracking-tight text-zinc-50">
            Legal
          </h1>

          <section className="mb-8">
            <h2 className="mb-3 text-sm font-semibold text-zinc-200">Terms</h2>
            <p className="text-sm leading-relaxed text-zinc-500">
              Cope.fun is an early MVP. By using the site you agree that
              features may change, break, or disappear without notice. Beliefs
              you enter may be processed to generate debate content. Do not rely
              on Cope for financial, legal, or medical decisions.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-3 text-sm font-semibold text-zinc-200">
              Privacy
            </h2>
            <p className="text-sm leading-relaxed text-zinc-500">
              Saved conversations are stored locally in your browser. We do not
              operate accounts, authentication, or a backend database in this
              version. If analytics or third-party services are added later,
              this policy will be updated.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-3 text-sm font-semibold text-zinc-200">
              Disclaimer
            </h2>
            <p className="text-sm leading-relaxed text-zinc-500">
              Agent responses are generated for demonstration and debate
              purposes. They do not represent the views of any real person or
              organisation. Conviction markets and wallet features described on
              the site are not yet live.
            </p>
          </section>
        </article>
      </main>
    </div>
  );
}
