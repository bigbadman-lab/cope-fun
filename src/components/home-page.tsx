"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { BeliefInput } from "./belief-input";
import { ConversationStage } from "./conversation-stage";
import { USER_DISPLAY_NAME } from "./avatar-placeholder";
import { ChatMessageRow, type ChatMessage } from "./debate-chat";
import { HeroMedia } from "./hero-media";
import { HomepageBackgroundVideo } from "./homepage-background-video";
import { useSetHomepageFooterInFlow } from "./homepage-footer-context";
import { TopNav } from "./top-nav";
import { RecentConversationsPreview } from "./recent-conversations-preview";
import { GuestBeliefGate } from "./guest-belief-gate";
import { getBeliefTopViewportPx } from "@/lib/belief-layout";
import { buildDebateTurnTimings } from "@/lib/debate-timing";
import {
  canGuestCreateBelief,
  recordGuestBeliefCreated,
  useGuestBeliefUsage,
} from "@/lib/guest-usage";
import { saveConversation } from "@/lib/saved-chats";
import { getWalletSessionSnapshot, useWalletSession } from "@/lib/wallet-session";
import {
  applyVoteChange,
  seedVoteCounts,
  type VoteChoice,
} from "@/lib/vote";

const SAVE_CONFIRM_MS = 700;

export type Phase =
  | "idle"
  | "belief-created"
  | "belief-moving"
  | "belief-settled"
  | "input-settling"
  | "agents-joining"
  | "debating"
  | "complete";

const RESPONSES: { author: string; text: (belief: string) => string }[] = [
  {
    author: "Cope Engine",
    text: (belief) =>
      `Belief registered. Running contradiction scan on "${belief}".`,
  },
  {
    author: "Mason",
    text: () =>
      "Hard disagree. That only holds if you ignore second-order effects.",
  },
  {
    author: "Victor",
    text: () =>
      "Mason's missing the point — the premise itself is shaky.",
  },
  {
    author: "Logan",
    text: () =>
      "Both of you are coping. Would anyone actually stake money on this?",
  },
  {
    author: "Theo",
    text: () =>
      "I'd believe it for 24 hours. Not a lifetime. Temporary conviction only.",
  },
];

const BELIEF_PAUSE_MS = 1500;
const MOVE_DURATION_MS = 900;
const BELIEF_SETTLED_PAUSE_MS = 500;
const AGENT_START_AFTER_INPUT_MS = 450;
const GROUP_FORMATION_PAUSE_MS = 600;

function buildAgentMessages(belief: string): ChatMessage[] {
  return RESPONSES.map((r, i) => ({
    id: `msg-${i}`,
    author: r.author,
    text: r.text(belief),
  }));
}

export function HomePage() {
  const [belief, setBelief] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const [lockedBelief, setLockedBelief] = useState("");
  const [visibleAgentCount, setVisibleAgentCount] = useState(0);
  const [showGroupFormation, setShowGroupFormation] = useState(false);
  const [typingAgent, setTypingAgent] = useState<string | null>(null);
  const [typingFadingOut, setTypingFadingOut] = useState(false);
  const [showCta, setShowCta] = useState(false);
  const [chatSaved, setChatSaved] = useState(false);
  const [saveToastVisible, setSaveToastVisible] = useState(false);
  const [believeCount, setBelieveCount] = useState(0);
  const [copeCount, setCopeCount] = useState(0);
  const [userVote, setUserVote] = useState<VoteChoice | null>(null);
  const [moveOffsetPx, setMoveOffsetPx] = useState(0);
  const [composerStartCenterY, setComposerStartCenterY] = useState<number | null>(
    null,
  );

  const router = useRouter();
  const wallet = useWalletSession();
  const guestUsage = useGuestBeliefUsage();

  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const beliefRef = useRef<HTMLDivElement>(null);
  const heroInputRef = useRef<HTMLTextAreaElement>(null);
  const agentsScheduledRef = useRef(false);

  const agentMessages = useMemo(
    () => (lockedBelief ? buildAgentMessages(lockedBelief) : []),
    [lockedBelief],
  );
  const isPostSubmit = phase !== "idle";
  const isDetaching =
    phase === "belief-created" || phase === "belief-moving";
  const isConversationLayout =
    phase === "belief-settled" ||
    phase === "input-settling" ||
    phase === "agents-joining" ||
    phase === "debating" ||
    phase === "complete";
  const isGuestBlocked =
    !wallet.connected && phase === "idle" && guestUsage.beliefCount >= 1;
  const setHomepageFooterInFlow = useSetHomepageFooterInFlow();

  useEffect(() => {
    if (!setHomepageFooterInFlow) return;

    setHomepageFooterInFlow(phase === "idle");
    return () => setHomepageFooterInFlow(true);
  }, [phase, setHomepageFooterInFlow]);

  const clearTimeouts = useCallback(() => {
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
  }, []);

  const scheduleAgentMessages = useCallback(() => {
    if (agentsScheduledRef.current) return;
    agentsScheduledRef.current = true;
    clearTimeouts();

    const { turns, ctaDelayMs } = buildDebateTurnTimings(
      RESPONSES.map((r) => r.author),
    );

    turns.forEach((turn, i) => {
      const typingTimer = setTimeout(() => {
        setTypingFadingOut(false);
        setTypingAgent(turn.author);
      }, turn.typingStartMs);
      timeoutsRef.current.push(typingTimer);

      const fadeTimer = setTimeout(
        () => setTypingFadingOut(true),
        turn.typingFadeMs,
      );
      timeoutsRef.current.push(fadeTimer);

      const messageTimer = setTimeout(() => {
        setTypingAgent(null);
        setTypingFadingOut(false);
        setVisibleAgentCount(i + 1);
      }, turn.messageMs);
      timeoutsRef.current.push(messageTimer);
    });

    const cta = setTimeout(() => {
      setPhase("complete");
      setShowCta(true);
    }, ctaDelayMs);
    timeoutsRef.current.push(cta);
  }, [clearTimeouts]);

  const beginDebating = useCallback(() => {
    setPhase("debating");
    scheduleAgentMessages();
  }, [scheduleAgentMessages]);

  const scheduleGroupFormation = useCallback(() => {
    clearTimeouts();
    setShowGroupFormation(true);

    const t = setTimeout(beginDebating, GROUP_FORMATION_PAUSE_MS);
    timeoutsRef.current.push(t);
  }, [clearTimeouts, beginDebating]);

  const beginAgentJoins = useCallback(() => {
    setPhase("agents-joining");
    scheduleGroupFormation();
  }, [scheduleGroupFormation]);

  const handleReset = useCallback(() => {
    clearTimeouts();
    agentsScheduledRef.current = false;
    setBelief("");
    setPhase("idle");
    setLockedBelief("");
    setVisibleAgentCount(0);
    setShowGroupFormation(false);
    setTypingAgent(null);
    setTypingFadingOut(false);
    setShowCta(false);
    setChatSaved(false);
    setBelieveCount(0);
    setCopeCount(0);
    setUserVote(null);
    setMoveOffsetPx(0);
    setComposerStartCenterY(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
    requestAnimationFrame(() => {
      heroInputRef.current?.focus({ preventScroll: true });
    });
  }, [clearTimeouts]);

  useEffect(() => () => clearTimeouts(), [clearTimeouts]);

  useEffect(() => {
    heroInputRef.current?.focus({ preventScroll: true });
  }, []);

  useEffect(() => {
    if (phase !== "belief-created") return;
    const t = setTimeout(() => {
      setMoveOffsetPx(0);
      setPhase("belief-moving");
    }, BELIEF_PAUSE_MS);
    return () => clearTimeout(t);
  }, [phase]);

  useEffect(() => {
    if (phase !== "belief-moving") return;

    const raf = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const el = beliefRef.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const targetTop = getBeliefTopViewportPx();
        setMoveOffsetPx(targetTop - rect.top);
      });
    });

    const fallback = setTimeout(() => {
      const rect = heroInputRef.current?.getBoundingClientRect();
      setComposerStartCenterY(
        rect ? rect.top + rect.height / 2 : null,
      );
      setPhase("belief-settled");
    }, MOVE_DURATION_MS + 80);

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(fallback);
    };
  }, [phase]);

  useEffect(() => {
    if (phase !== "belief-settled") return;
    const t = setTimeout(() => setPhase("input-settling"), BELIEF_SETTLED_PAUSE_MS);
    return () => clearTimeout(t);
  }, [phase]);

  useEffect(() => {
    if (phase !== "input-settling") return;
    const t = setTimeout(beginAgentJoins, AGENT_START_AFTER_INPUT_MS);
    return () => clearTimeout(t);
  }, [phase, beginAgentJoins]);

  function handleBeliefTransitionEnd(e: React.TransitionEvent<HTMLDivElement>) {
    if (phase !== "belief-moving" || e.propertyName !== "transform") return;
    const rect = heroInputRef.current?.getBoundingClientRect();
    setComposerStartCenterY(
      rect ? rect.top + rect.height / 2 : null,
    );
    setPhase("belief-settled");
  }

  function handleSubmit() {
    const trimmed = belief.trim();
    if (!trimmed || isPostSubmit) return;

    const session = getWalletSessionSnapshot();
    if (!session.connected) {
      if (!canGuestCreateBelief()) return;
      recordGuestBeliefCreated();
    }

    const seeded = seedVoteCounts(trimmed);
    setLockedBelief(trimmed);
    setBelieveCount(seeded.believeCount);
    setCopeCount(seeded.copeCount);
    setUserVote(null);
    setMoveOffsetPx(0);
    setPhase("belief-created");
  }

  const handleVote = useCallback(
    (choice: VoteChoice) => {
      const next = applyVoteChange(
        { believeCount, copeCount, userVote },
        choice,
      );
      setBelieveCount(next.believeCount);
      setCopeCount(next.copeCount);
      setUserVote(next.userVote);
    },
    [believeCount, copeCount, userVote],
  );

  const handleSaveChat = useCallback(() => {
    if (!lockedBelief || chatSaved) return;

    const saved = saveConversation({
      belief: lockedBelief,
      messages: [
        {
          id: "user",
          author: USER_DISPLAY_NAME,
          text: lockedBelief,
          isUser: true,
        },
        ...agentMessages,
      ],
      userVote,
      believeCount,
      copeCount,
    });

    setChatSaved(true);
    setSaveToastVisible(true);
    setTimeout(() => router.push(`/room/${saved.slug}`), SAVE_CONFIRM_MS);
  }, [
    lockedBelief,
    chatSaved,
    agentMessages,
    router,
    userVote,
    believeCount,
    copeCount,
  ]);

  const userMessage: ChatMessage = {
    id: "user",
    author: USER_DISPLAY_NAME,
    text: lockedBelief,
    isUser: true,
  };

  return (
    <div
      className={
        isConversationLayout ? "relative isolate min-h-dvh" : "relative isolate"
      }
    >
      <HomepageBackgroundVideo />
      <div
        className={
          isConversationLayout
            ? "relative z-10 flex min-h-dvh flex-col"
            : "relative z-10 flex flex-col"
        }
      >
        <TopNav onLogoClick={handleReset} />

        <main className={isConversationLayout ? "flex-1 overflow-hidden pt-14" : "pt-14"}>
        {isConversationLayout ? (
          <ConversationStage
            userMessage={userMessage}
            showGroupFormation={showGroupFormation}
            typingAgent={typingAgent}
            typingFadingOut={typingFadingOut}
            agentMessages={agentMessages}
            visibleAgentCount={visibleAgentCount}
            showCta={showCta}
            belief={belief}
            inputGlideActive={phase !== "belief-settled"}
            composerStartCenterY={composerStartCenterY}
            believeCount={believeCount}
            copeCount={copeCount}
            userVote={userVote}
            onVote={handleVote}
            onSaveChat={handleSaveChat}
            chatSaved={chatSaved}
          />
        ) : (
          <div className="mx-auto flex w-full max-w-md min-h-home-idle flex-col justify-center px-4 py-8">
            <div
                className={`mb-6 transition-[opacity,filter,transform] duration-500 ease-out ${
                  phase === "idle"
                    ? "scale-100 opacity-100 blur-0"
                    : "pointer-events-none scale-[0.98] opacity-0 blur-sm"
                }`}
              >
                <div className="flex flex-col items-center text-center">
                  <HeroMedia />
                  <h1 className="mb-3 text-2xl font-semibold tracking-tight text-white drop-shadow-[0_1px_10px_rgb(0_0_0/0.22)] sm:text-3xl">
                    What do you believe?
                  </h1>
                </div>
              </div>

              {isDetaching && (
                <div
                  ref={beliefRef}
                  onTransitionEnd={handleBeliefTransitionEnd}
                  className="mb-4 will-change-transform transition-transform ease-in-out"
                  style={{
                    transform: `translateY(${moveOffsetPx}px)`,
                    transitionDuration: `${MOVE_DURATION_MS}ms`,
                  }}
                >
                  <ChatMessageRow message={userMessage} />
                </div>
              )}

              {isGuestBlocked ? (
                <GuestBeliefGate />
              ) : (
                <BeliefInput
                  ref={heroInputRef}
                  value={belief}
                  onChange={setBelief}
                  onSubmit={handleSubmit}
                  disabled={isPostSubmit}
                  compact={isPostSubmit}
                  animateExamples={phase === "idle"}
                />
              )}
              {phase === "idle" && !isGuestBlocked && (
                <RecentConversationsPreview />
              )}
          </div>
        )}
        </main>
      </div>

      {saveToastVisible && (
        <div
          className="pointer-events-none fixed inset-x-0 bottom-24 z-50 flex justify-center px-4"
          role="status"
          aria-live="polite"
        >
          <p className="rounded-full border border-zinc-200/80 bg-background/95 px-4 py-2 text-sm font-medium text-zinc-800 shadow-lg backdrop-blur-sm dark:border-white/10 dark:bg-background/95 dark:text-zinc-100">
            Room created
          </p>
        </div>
      )}
    </div>
  );
}
