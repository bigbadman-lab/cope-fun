"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { BeliefInput } from "./belief-input";
import { ConversationStage } from "./conversation-stage";
import { ChatMessageRow, type ChatMessage } from "./debate-chat";
import { LogoPlaceholder } from "./logo-placeholder";
import { TopNav } from "./top-nav";
import { getBeliefTopViewportPx } from "@/lib/belief-layout";

export type Phase =
  | "idle"
  | "belief-created"
  | "belief-moving"
  | "belief-settled"
  | "input-settling"
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
const AGENT_MESSAGE_DELAYS = [0, 700, 1400, 2100, 2800];
const CTA_DELAY_MS = 3600;

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
  const [showCta, setShowCta] = useState(false);
  const [moveOffsetPx, setMoveOffsetPx] = useState(0);

  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const beliefRef = useRef<HTMLDivElement>(null);
  const agentsScheduledRef = useRef(false);

  const agentMessages = lockedBelief ? buildAgentMessages(lockedBelief) : [];
  const isPostSubmit = phase !== "idle";
  const isDetaching =
    phase === "belief-created" || phase === "belief-moving";
  const isConversationLayout =
    phase === "belief-settled" ||
    phase === "input-settling" ||
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

    AGENT_MESSAGE_DELAYS.forEach((delay, i) => {
      const t = setTimeout(() => setVisibleAgentCount(i + 1), delay);
      timeoutsRef.current.push(t);
    });

    const cta = setTimeout(() => {
      setPhase("complete");
      setShowCta(true);
    }, CTA_DELAY_MS);
    timeoutsRef.current.push(cta);
  }, [clearTimeouts]);

  const beginDebating = useCallback(() => {
    setPhase("debating");
    scheduleAgentMessages();
  }, [scheduleAgentMessages]);

  useEffect(() => () => clearTimeouts(), [clearTimeouts]);

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
    const t = setTimeout(beginDebating, AGENT_START_AFTER_INPUT_MS);
    return () => clearTimeout(t);
  }, [phase, beginDebating]);

  function handleBeliefTransitionEnd(e: React.TransitionEvent<HTMLDivElement>) {
    if (phase !== "belief-moving" || e.propertyName !== "transform") return;
    setPhase("belief-settled");
  }

  function handleSubmit() {
    const trimmed = belief.trim();
    if (!trimmed || isPostSubmit) return;

    setLockedBelief(trimmed);
    setMoveOffsetPx(0);
    setPhase("belief-created");
  }

  const userMessage: ChatMessage = {
    id: "user",
    author: "You",
    text: lockedBelief,
    isUser: true,
  };

  return (
    <div className="flex min-h-dvh flex-col">
      <TopNav />

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
            agentMessages={agentMessages}
            visibleAgentCount={visibleAgentCount}
            showCta={showCta}
            belief={belief}
            inputGlideActive={phase !== "belief-settled"}
          />
        ) : (
          <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 px-4">
            <div className="mx-auto w-full max-w-md">
              <div
                className={`overflow-hidden transition-all duration-500 ease-out ${
                  phase === "idle"
                    ? "mb-6 max-h-96 opacity-100"
                    : "mb-0 max-h-0 opacity-0"
                }`}
              >
                <div className="flex flex-col items-center text-center">
                  <LogoPlaceholder size="lg" className="mb-8" />
                  <h1 className="mb-3 text-3xl font-semibold tracking-tight text-zinc-50 sm:text-4xl">
                    What do you believe?
                  </h1>
                  <p className="text-base text-zinc-400">
                    Enter a belief. Watch it argue.
                  </p>
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
                value={belief}
                onChange={setBelief}
                onSubmit={handleSubmit}
                disabled={isPostSubmit}
                compact={isPostSubmit}
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
