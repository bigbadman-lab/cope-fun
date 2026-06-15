"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { BeliefInput } from "./belief-input";
import { ConversationStage } from "./conversation-stage";
import { USER_DISPLAY_NAME } from "./avatar-placeholder";
import { ChatMessageRow, type ChatMessage } from "./debate-chat";
import { TopNav } from "./top-nav";
import { RecentConversationsPreview } from "./recent-conversations-preview";
import { getBeliefTopViewportPx } from "@/lib/belief-layout";
import { buildDebateTurnTimings } from "@/lib/debate-timing";
import { saveConversation } from "@/lib/saved-chats";
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
  const [believeCount, setBelieveCount] = useState(0);
  const [copeCount, setCopeCount] = useState(0);
  const [userVote, setUserVote] = useState<VoteChoice | null>(null);
  const [moveOffsetPx, setMoveOffsetPx] = useState(0);

  const router = useRouter();

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

    const fallback = setTimeout(
      () => setPhase("belief-settled"),
      MOVE_DURATION_MS + 80,
    );

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
    setPhase("belief-settled");
  }

  function handleSubmit() {
    const trimmed = belief.trim();
    if (!trimmed || isPostSubmit) return;

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

    saveConversation({
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
    setTimeout(() => router.push("/conversations"), SAVE_CONFIRM_MS);
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
    <div className="flex min-h-dvh flex-col">
      <TopNav onLogoClick={handleReset} />

      <main
        className={`flex-1 pt-14 ${
          isConversationLayout
            ? "overflow-hidden"
            : "relative min-h-[calc(100dvh-3.5rem)] overflow-hidden"
        }`}
      >
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
            believeCount={believeCount}
            copeCount={copeCount}
            userVote={userVote}
            onVote={handleVote}
            onSaveChat={handleSaveChat}
            chatSaved={chatSaved}
          />
        ) : (
          <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 px-4">
            <div className="mx-auto w-full max-w-md">
              <div
                className={`mb-6 transition-[opacity,filter,transform] duration-500 ease-out ${
                  phase === "idle"
                    ? "scale-100 opacity-100 blur-0"
                    : "pointer-events-none scale-[0.98] opacity-0 blur-sm"
                }`}
              >
                <div className="flex flex-col items-center text-center">
                  <Image
                    src="/logomain2.png"
                    alt=""
                    width={150}
                    height={75}
                    className="mb-8 h-auto w-24 sm:w-28 md:w-32"
                    priority
                  />
                  <h1 className="mb-3 text-2xl font-semibold tracking-tight text-zinc-50 sm:text-3xl">
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

              <BeliefInput
                ref={heroInputRef}
                value={belief}
                onChange={setBelief}
                onSubmit={handleSubmit}
                disabled={isPostSubmit}
                compact={isPostSubmit}
                animateExamples={phase === "idle"}
              />
              {phase === "idle" && <RecentConversationsPreview />}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
