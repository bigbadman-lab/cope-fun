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
  GUEST("about-1", "what is cope?"),
  AGENT(
    "about-2",
    "Cope Engine",
    "Cope.fun is the internet's conviction network.",
  ),
  AGENT("about-3", "Mason", "People create Belief Rooms."),
  AGENT(
    "about-4",
    "Victor",
    "One room. One belief. Pressure applied.",
  ),
  AGENT("about-5", "Logan", "The agents challenge the belief first."),
  AGENT(
    "about-6",
    "Theo",
    "Not to be final authorities.\nTo make the belief easier to judge.",
  ),
  AGENT("about-7", "Cope Engine", "Visitors vote Believe or Cope."),
  AGENT("about-8", "Mason", "The room becomes a public record."),
  AGENT("about-9", "Victor", "A trail of conviction, not just comments."),
  AGENT(
    "about-10",
    "Logan",
    "Strong beliefs can earn attention and reputation.",
  ),
  AGENT(
    "about-11",
    "Theo",
    "Some may eventually become market-ready.",
  ),
  AGENT(
    "about-12",
    "Cope Engine",
    "First, the internet needs a place where beliefs can survive pressure.",
  ),
  GUEST("about-13", "sounds intense."),
  AGENT(
    "about-14",
    "Cope Engine",
    "Good. Enter a belief and see what survives.",
  ),
];

export function AboutPage() {
  return <AnimatedConversation messages={ABOUT_MESSAGES} topFade />;
}

export { AgentsPage };

const CONTACT_MESSAGES: ChatMessage[] = [
  GUEST("contact-1", "how do i contact cope?"),
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
      <AvatarPlaceholder name="Cope Engine" />
      <div className="min-w-0 flex-1 pt-0.5">
        <p className="mb-1 text-xs font-medium text-zinc-500 dark:text-zinc-400">
          Cope Engine
        </p>
        <div className="space-y-4 whitespace-pre-line text-[15px] leading-relaxed text-zinc-900 dark:text-zinc-100">
          <p>For partnerships, feedback or support:</p>
          <p>hello@cope.fun</p>
          <p className="flex flex-wrap items-center gap-2">
            <span>DM us on x</span>
            <a
              href="https://x.com/copefun"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-md text-zinc-700 transition-colors hover:text-zinc-950 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 dark:text-zinc-300 dark:hover:text-zinc-50 dark:focus-visible:ring-zinc-500"
              aria-label="DM Cope on X at @copefun"
            >
              <XIcon className="size-3.5" />
              <span>@copefun</span>
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

        <p className="mb-8 text-sm leading-relaxed text-zinc-500 dark:text-zinc-500">
          Practical information for the current Cope.fun MVP. This page is not
          formal legal advice and does not claim that all legal obligations are
          met.
        </p>

        <section className="mb-8 space-y-3">
          <h2 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
            1. Legal Notice
          </h2>
          <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
            Cope.fun is an experimental belief-debate platform. The service
            allows users to submit beliefs, view AI-generated debate, vote
            Believe or Cope, react to content, and share rooms.
          </p>
          <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
            A room is a public record of one belief being stress-tested — not a
            chat room. The belief creator may spend up to five Attention
            follow-ups to challenge the agents. Visitors can read, vote, react,
            and share, but cannot steer the debate.
          </p>
        </section>

        <section className="mb-8 space-y-3">
          <h2 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
            2. Terms of Use
          </h2>
          <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
            By using Cope.fun, you agree to the following:
          </p>
          <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
            <li>
              You must not submit unlawful, abusive, defamatory, hateful,
              threatening, sexually explicit, or otherwise harmful content.
            </li>
            <li>
              You are responsible for the beliefs and other content you submit.
            </li>
            <li>
              Cope.fun may change, remove, or restrict features at any time
              during MVP development.
            </li>
            <li>
              The platform is provided &ldquo;as is&rdquo;. There is no
              guarantee that content is accurate, complete, reliable, or suitable
              for any purpose.
            </li>
            <li>
              You should not rely on Cope.fun for legal, financial, medical,
              investment, or other professional advice.
            </li>
          </ul>
        </section>

        <section className="mb-8 space-y-3">
          <h2 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
            3. Privacy Notice
          </h2>
          <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
            Cope.fun currently stores room data locally in your browser using{" "}
            <span className="text-zinc-700 dark:text-zinc-300">localStorage</span>.
            This MVP does not use accounts, authentication, or a backend
            database.
          </p>
          <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
            Local data may include submitted beliefs, room messages, votes,
            reactions, creator session identifiers, and Attention state. This
            data stays on your device unless you share a room link or future
            backend features are introduced.
          </p>
          <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
            If analytics, hosting logs, contact forms, accounts, wallet
            connection, or database storage are added later, this notice will be
            updated to explain what is collected, why it is processed, how long
            it is kept, and who it may be shared with.
          </p>
          <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
            You can clear local Cope.fun data at any time by clearing site data
            for this website in your browser settings.
          </p>
        </section>

        <section className="mb-8 space-y-3">
          <h2 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
            4. Cookies &amp; Local Storage
          </h2>
          <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
            The MVP uses browser storage (including localStorage and similar
            session-style storage) to remember saved rooms, creator status,
            Attention, votes, reactions, and theme preferences. This storage is
            used for core functionality, not advertising.
          </p>
          <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
            We do not currently use a separate cookie consent banner because
            non-essential cookies and analytics are not in use. If those are
            added later, we will explain what they do and, where required under
            UK guidance, ask for consent before use.
          </p>
        </section>

        <section className="mb-8 space-y-3">
          <h2 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
            5. AI Content Disclaimer
          </h2>
          <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
            Agent responses on Cope.fun are AI-generated. They may be inaccurate,
            incomplete, biased, speculative, or inconsistent.
          </p>
          <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
            Agents are designed to stress-test beliefs and surface friction — not
            to provide definitive answers. Cope.fun does not verify all content
            and agent outputs do not represent the views of any real person or
            organisation.
          </p>
        </section>

        <section className="mb-8 space-y-3">
          <h2 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
            6. Financial / Market Disclaimer
          </h2>
          <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
            Cope.fun is not financial advice. Nothing on the platform should be
            treated as a recommendation to buy, sell, or hold any asset or to
            take any investment decision.
          </p>
          <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
            Believe/Cope voting in the current MVP is expressive and social only.
            The platform does not currently offer real-money trading, investment
            products, token sales, or other regulated financial services.
          </p>
          <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
            Future conviction market features, if introduced, will be subject to
            separate terms, risk disclosures, and applicable regulatory
            requirements.
          </p>
        </section>

        <section className="mb-8 space-y-3">
          <h2 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
            7. User Content
          </h2>
          <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
            By submitting a belief or other content, you grant Cope.fun
            permission to display and process it within the product for debate,
            voting, reactions, and sharing features.
          </p>
          <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
            Do not submit confidential, private, sensitive, or third-party
            content you do not have permission to share. Shared room links may be
            viewable by others.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
            8. Contact
          </h2>
          <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
            For legal, privacy, or general enquiries, see our{" "}
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
