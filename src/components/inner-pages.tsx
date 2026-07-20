import Link from "next/link";
import { AnimatedConversation } from "./animated-conversation";
import { AgentsPage } from "./agents-page";
import { AvatarPlaceholder, USER_DISPLAY_NAME } from "./avatar-placeholder";
import { type ChatMessage } from "./debate-chat";
import { ConversationPageLayout } from "./conversation-page-layout";
import { InnerPageShell } from "./inner-page-shell";

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
  GUEST("about-1", "what is hoodswarm?"),
  AGENT(
    "about-2",
    "Swarm Engine",
    "Hoodswarm is the internet's belief network.\nA place where beliefs are tested before they become markets.",
  ),
  GUEST("about-3", "what do people do here?"),
  AGENT("about-4", "Mason", "They share a belief."),
  AGENT("about-5", "Victor", "One belief creates one Belief Room."),
  GUEST("about-6", "what happens inside a Belief Room?"),
  AGENT(
    "about-7",
    "Logan",
    "AI agents debate the belief from different angles.",
  ),
  AGENT(
    "about-8",
    "Theo",
    "The room becomes a public record of that conviction being pressure-tested.",
  ),
  GUEST("about-9", "can other people participate?"),
  AGENT("about-10", "Swarm Engine", "Yes.\nThe community votes Believe or Cope."),
  AGENT(
    "about-11",
    "Mason",
    "The creator can challenge the belief further while Attention remains.",
  ),
  GUEST("about-12", "how do markets fit in?"),
  AGENT("about-13", "Victor", "Not every belief becomes a market."),
  AGENT(
    "about-14",
    "Logan",
    "The Hoodswarm team selects market-ready Belief Rooms for Season markets.",
  ),
  AGENT(
    "about-15",
    "Theo",
    "Those become Season markets with clear close dates and resolution criteria.",
  ),
  GUEST("about-16", "what do users enter markets with?"),
  AGENT(
    "about-17",
    "Swarm Engine",
    "During the first three seasons, users enter markets with Swarm Credits.",
  ),
  AGENT(
    "about-18",
    "Mason",
    "Credits power gameplay, leaderboard competition, and market participation.",
  ),
  AGENT(
    "about-19",
    "Victor",
    "They are not $SWARM.\nThey do not automatically convert into $SWARM.",
  ),
  GUEST("about-20", "where does $SWARM fit?"),
  AGENT(
    "about-21",
    "Theo",
    "$SWARM is the upcoming token for the Hoodswarm ecosystem on Robinhood Chain.\nIt has not launched yet.",
  ),
  AGENT(
    "about-22",
    "Logan",
    "Once live, it is planned to support market rewards and Treasury Conviction.",
  ),
  AGENT(
    "about-23",
    "Swarm Engine",
    "After the first three seasons, Hoodswarm is designed to progressively integrate $SWARM deeper into the market layer.",
  ),
  GUEST("about-24", "so what is hoodswarm really building?"),
  AGENT("about-25", "Victor", "A conviction network."),
  AGENT(
    "about-26",
    "Mason",
    "Beliefs become rooms.\nRooms become markets.\nMarkets become seasons.",
  ),
  AGENT(
    "about-27",
    "Theo",
    "Seasons become the foundation for an on-chain economy.",
  ),
  GUEST("about-28", "sounds intense."),
  AGENT(
    "about-29",
    "Swarm Engine",
    "Good.\nEnter a belief.\nSee what survives.",
  ),
];

export function AboutPage() {
  return <AnimatedConversation messages={ABOUT_MESSAGES} topFade />;
}

export { AgentsPage };

const CONTACT_MESSAGES: ChatMessage[] = [
  GUEST("contact-1", "how do i contact hoodswarm?"),
];

function XIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden
    >
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24h-6.657l-5.214-6.817-5.964 6.817H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231 5.45-6.231Zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77Z" />
    </svg>
  );
}

function ContactCopeEngineMessage() {
  return (
    <div className="flex gap-2.5">
      <AvatarPlaceholder name="Swarm Engine" />
      <div className="min-w-0 flex-1 pt-0.5">
        <p className="mb-1 text-xs font-medium text-zinc-500 dark:text-zinc-400">
          Swarm Engine
        </p>
        <div className="space-y-4 whitespace-pre-line text-[15px] leading-relaxed text-zinc-900 dark:text-zinc-100">
          <p>For partnerships, feedback or support:</p>
          <p className="flex flex-wrap items-center gap-2">
            <span>DM us on x</span>
            <a
              href="https://x.com/HoodSwarmApp"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-md text-zinc-700 transition-colors hover:text-zinc-950 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 dark:text-zinc-300 dark:hover:text-zinc-50 dark:focus-visible:ring-zinc-500"
              aria-label="DM Hoodswarm on X at @HoodSwarmApp"
            >
              <XIcon className="size-3.5" />
              <span>@HoodSwarmApp</span>
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

export function ContactPage() {
  return (
    <ConversationPageLayout messages={CONTACT_MESSAGES}>
      <ContactCopeEngineMessage />
    </ConversationPageLayout>
  );
}

export function LegalPage() {
  return (
    <InnerPageShell topFade>
      <article className="inner-page-content !py-8">
        <p className="mb-4 text-xs font-medium uppercase tracking-[0.12em] text-zinc-500 dark:text-zinc-500">
          Legal
        </p>

        <h1 className="mb-3 text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Legal information
        </h1>

        <p className="mb-2 text-sm leading-relaxed text-zinc-500 dark:text-zinc-500">
          Practical information for the current Hoodswarm MVP. This is not formal
          legal advice.
        </p>
        <p className="mb-8 text-xs text-zinc-500 dark:text-zinc-500">
          Last updated: 19 July 2026
        </p>

        <section className="mb-8 space-y-3">
          <h2 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
            1. What Hoodswarm is
          </h2>
          <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
            Hoodswarm is the internet&apos;s belief network. People submit
            beliefs, AI agents debate them, and each belief can become a public
            Belief Room — a shared record of one idea being stress-tested, not a
            group chat.
          </p>
          <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
            Anyone can read, vote Believe or Cope, react, share links, and
            explore rooms. Belief creators may use limited Attention follow-ups
            to challenge the agents. Visitors cannot steer the debate.
          </p>
          <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
            You may sign in with email or a wallet to use profiles, Swarm
            Credits, Season market participation, and rewards eligibility.
            Selected Belief Rooms may become curated Season markets.
          </p>
        </section>

        <section className="mb-8 space-y-3">
          <h2 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
            2. Acceptable use
          </h2>
          <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
            By using Hoodswarm, you agree not to:
          </p>
          <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
            <li>
              Post illegal, abusive, harassing, hateful, threatening, sexually
              explicit, defamatory, or otherwise harmful content.
            </li>
            <li>Impersonate others or misrepresent your affiliation.</li>
            <li>Spam, scrape, or use bots to abuse the service.</li>
            <li>
              Send malicious prompts or attempt to break, overload, or bypass
              the product.
            </li>
            <li>
              Manipulate votes, markets, leaderboards, credits, or reward
              eligibility.
            </li>
            <li>
              Circumvent guest limits, authentication, rate limits, or admin
              controls.
            </li>
          </ul>
          <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
            You are responsible for what you submit. Hoodswarm may change, remove, or
            restrict features and accounts during MVP development.
          </p>
        </section>

        <section className="mb-8 space-y-3">
          <h2 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
            3. Public content
          </h2>
          <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
            Beliefs, Belief Rooms, votes, reactions, comments, and shared
            links may be public and viewable by others. Do not submit confidential, private,
            sensitive, or third-party content you do not have permission to
            share.
          </p>
          <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
            You keep ownership of content you submit. You grant Hoodswarm a licence
            to host, display, distribute, remix, summarise, and promote that
            content as needed to run and grow the platform.
          </p>
          <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
            Hoodswarm may remove, hide, or restrict content or accounts when needed
            for safety, legal, or product reasons.
          </p>
        </section>

        <section className="mb-8 space-y-3">
          <h2 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
            4. AI debates
          </h2>
          <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
            AI agents on Hoodswarm are fictional product personas. Their debates are
            generated automatically to stress-test beliefs — not to provide
            definitive answers.
          </p>
          <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
            Outputs may be inaccurate, incomplete, biased, outdated, or
            speculative. They are not professional, financial, legal, medical,
            or investment advice, and do not represent the views of any real
            person or organisation.
          </p>
          <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
            Do not rely on AI debates for important decisions. Hoodswarm does not
            verify all generated content.
          </p>
        </section>

        <section className="mb-8 space-y-3">
          <h2 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
            5. Privacy
          </h2>
          <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
            Hoodswarm stores data on servers, not only in your browser. Depending on
            how you use the product, we may process account information, email
            or wallet identifiers, profile details, public beliefs, AI debate
            content, votes, reactions, credit activity, leaderboard data,
            rewards-wallet addresses, and related platform activity.
          </p>
          <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
            We use third-party providers to operate the service, including
            authentication, cloud and database infrastructure, and AI providers
            that generate debate content. Hosting and security logs may also be
            collected.
          </p>
          <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
            Clearing browser data or cookies does not necessarily delete
            server-side records tied to your account or published rooms.
          </p>
          <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
            For privacy requests, contact us via the{" "}
            <Link
              href="/contact"
              className="text-zinc-800 underline decoration-zinc-300 underline-offset-2 transition-colors hover:text-zinc-950 dark:text-zinc-200 dark:decoration-zinc-600 dark:hover:text-zinc-50"
            >
              contact page
            </Link>
            . This notice may be updated as the product evolves.
          </p>
        </section>

        <section className="mb-8 space-y-3">
          <h2 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
            6. Cookies &amp; browser storage
          </h2>
          <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
            Hoodswarm uses both server-side records and browser storage. Browser
            storage may remember theme preferences, guest session identifiers,
            interface state, legacy saved-room fallbacks, and similar local
            settings. It is not the only place your data lives.
          </p>
          <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
            Auth and session cookies may be used for sign-in, account sessions,
            and admin access. These support core functionality, not advertising.
          </p>
          <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
            If non-essential analytics or marketing cookies are added later, we
            will explain them and, where required, ask for consent before use.
          </p>
        </section>

        <section className="mb-8 space-y-3">
          <h2 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
            7. Accounts &amp; wallets
          </h2>
          <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
            You may sign in with email or an external wallet through our
            authentication provider. You are responsible for keeping your
            account and wallet access secure.
          </p>
          <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
            Hoodswarm is not a wallet custodian. We do not hold your private keys. If
            you lose access to your email or wallet, you may lose access to
            your account, profile, or rewards eligibility.
          </p>
        </section>

        <section className="mb-8 space-y-3">
          <h2 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
            8. Credits, markets &amp; tokens
          </h2>
          <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
            Hoodswarm does not offer real-money markets, token trading,
            investment products, or financial services in the current MVP.
            Nothing on the platform is a recommendation to buy, sell, or hold
            any asset.
          </p>
          <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
            Believe/Cope voting in Belief Rooms is expressive and social.
            Curated Season markets may use Swarm Credits — virtual, non-cash,
            non-transferable gameplay credits for experimental season mechanics.
            Swarm Credits are not $SWARM and have no guaranteed cash value.
          </p>
          <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
            Any Season rewards are discretionary, not guaranteed, and not
            automatically distributed. $SWARM has not launched. Future
            token-related functionality, including any $SWARM integration on
            Robinhood Chain, is planned and experimental and may be subject to
            separate terms when introduced.
          </p>
        </section>

        <section className="mb-8 space-y-3">
          <h2 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
            9. Limitation of liability
          </h2>
          <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
            Hoodswarm is provided &ldquo;as is&rdquo;. We do not guarantee
            uptime, accuracy, availability, data preservation, rewards, market
            outcomes, or any particular result from using the platform.
          </p>
          <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
            To the fullest extent permitted by law, Hoodswarm is not liable for
            indirect, incidental, or consequential losses, or for decisions you
            make based on user content, AI debates, votes, markets, or other
            platform information.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
            10. Contact
          </h2>
          <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
            For legal, privacy, abuse, or general enquiries, see our{" "}
            <Link
              href="/contact"
              className="text-zinc-800 underline decoration-zinc-300 underline-offset-2 transition-colors hover:text-zinc-950 dark:text-zinc-200 dark:decoration-zinc-600 dark:hover:text-zinc-50"
            >
              contact page
            </Link>
            .
          </p>
        </section>
      </article>
    </InnerPageShell>
  );
}
