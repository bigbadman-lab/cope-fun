"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { BeliefInput } from "./belief-input";
import { ConversationStage } from "./conversation-stage";
import { USER_DISPLAY_NAME } from "./avatar-placeholder";
import { ChatMessageRow, type ChatMessage } from "./debate-chat";
import { HeroMedia } from "./hero-media";
import { HomepageBackground } from "./homepage-background";
import { useSetHomepageFooterInFlow } from "./homepage-footer-context";
import { TopNav } from "./top-nav";
import { RecentConversationsPreview } from "./recent-conversations-preview";
import { GuestBeliefGate } from "./guest-belief-gate";
import { getAnonymousSessionToken } from "@/lib/anonymous-token";
import { throwIfRateLimited, readRateLimitMessage } from "@/lib/rate-limit/client";
import { getBeliefTopViewportPx } from "@/lib/belief-layout";
import { buildDebateTurnTimings } from "@/lib/debate-timing";
import {
  canGuestCreateBelief,
  recordGuestBeliefCreated,
  useGuestBeliefUsage,
} from "@/lib/guest-usage";
import { saveConversation, type SavedConversation } from "@/lib/saved-chats";
import {
  prependRecentBelief,
  recentBeliefFromSavedRoom,
  refetchRecentBeliefs,
} from "@/lib/recent-beliefs";
import { useAppAuth } from "@/hooks/use-app-auth";
import { MAX_ROOM_ATTENTION } from "@/lib/room-follow-up";
import { applyVoteChange, type VoteChoice } from "@/lib/vote";
import type { RoomSearchResult } from "@/lib/room-search";
import type {
  BeliefValidationResult,
  DebateGenerationResult,
} from "@/lib/cope-engine";

const VALIDATION_ERROR_MESSAGE =
  "The Swarm Engine couldn’t test that input. Try again.";
const GUEST_LIMIT_MESSAGE =
  "Sign in to keep testing ideas with the Swarm Engine.";
const DEBUG_HOMEPAGE_FLOW = process.env.NODE_ENV !== "production";

type SubmitStage = "idle" | "validating" | "generating" | "opening";

const SUBMIT_STAGE_LABELS: Record<
  Exclude<SubmitStage, "idle">,
  string
> = {
  validating: "Checking belief…",
  generating: "Agents taking positions…",
  opening: "Opening the room…",
};

type SaveRoomResponse = {
  ok: boolean;
  slug?: string;
  room?: SavedConversation;
  error?: string;
};

type HomePageProps = {
  initialRecentBeliefs?: RoomSearchResult[];
};

export type Phase =
  | "idle"
  | "belief-created"
  | "belief-moving"
  | "belief-settled"
  | "input-settling"
  | "agents-joining"
  | "debating"
  | "complete";

function logHomepageFlow(message: string, data?: Record<string, unknown>) {
  if (!DEBUG_HOMEPAGE_FLOW) return;
  console.info(`[Homepage belief flow] ${message}`, data ?? {});
}

const RESPONSES: { author: string; text: (belief: string) => string }[] = [
  {
    author: "Swarm Engine",
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

const BELIEF_PAUSE_MS = 300;
const MOVE_DURATION_MS = 900;
const BELIEF_SETTLED_PAUSE_MS = 500;
const AGENT_START_AFTER_INPUT_MS = 450;
const GROUP_FORMATION_PAUSE_MS = 600;

function buildFallbackAgentMessages(belief: string): ChatMessage[] {
  return RESPONSES.map((r, i) => ({
    id: `msg-${i}`,
    author: r.author,
    text: r.text(belief),
  }));
}

function BeliefProcessingStatus({
  stage,
}: {
  stage: Exclude<SubmitStage, "idle">;
}) {
  const label = SUBMIT_STAGE_LABELS[stage];

  return (
    <div
      className="mb-3 flex min-h-6 items-center justify-center gap-2 text-center text-sm font-medium text-white/90 drop-shadow-[0_1px_10px_rgb(0_0_0/0.22)]"
      role="status"
      aria-live="polite"
    >
      <span className="size-1.5 shrink-0 rounded-full bg-cope-orange animate-pulse" />
      <span key={stage} className="animate-message-in">
        {label}
      </span>
    </div>
  );
}

export function HomePage({
  initialRecentBeliefs = [],
}: HomePageProps) {
  const [belief, setBelief] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const [lockedBelief, setLockedBelief] = useState("");
  const [agentMessages, setAgentMessages] = useState<ChatMessage[]>([]);
  const [visibleAgentCount, setVisibleAgentCount] = useState(0);
  const [showGroupFormation, setShowGroupFormation] = useState(false);
  const [typingAgent, setTypingAgent] = useState<string | null>(null);
  const [typingFadingOut, setTypingFadingOut] = useState(false);
  const [showCta, setShowCta] = useState(false);
  const [chatSaved, setChatSaved] = useState(false);
  const [isSavingChat, setIsSavingChat] = useState(false);
  const [saveErrorMessage, setSaveErrorMessage] = useState<string | null>(null);
  const [validationMessage, setValidationMessage] = useState<string | null>(null);
  const [submitStage, setSubmitStage] = useState<SubmitStage>("idle");
  const [believeCount, setBelieveCount] = useState(0);
  const [copeCount, setCopeCount] = useState(0);
  const [userVote, setUserVote] = useState<VoteChoice | null>(null);
  const [moveOffsetPx, setMoveOffsetPx] = useState(0);
  const [composerStartCenterY, setComposerStartCenterY] = useState<number | null>(
    null,
  );

  const router = useRouter();
  const { authenticated, authFetch } = useAppAuth();
  const guestUsage = useGuestBeliefUsage();

  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const beliefRef = useRef<HTMLDivElement>(null);
  const heroInputRef = useRef<HTMLTextAreaElement>(null);
  const agentsScheduledRef = useRef(false);
  const submitInFlightRef = useRef(false);
  const submitAttemptIdRef = useRef(0);

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
    !authenticated && phase === "idle" && guestUsage.beliefCount >= 1;
  const isSubmitProcessing = submitStage !== "idle";
  const setHomepageFooterInFlow = useSetHomepageFooterInFlow();

  const resetSubmitFlow = useCallback(() => {
    setSubmitStage("idle");
    submitInFlightRef.current = false;
    requestAnimationFrame(() => {
      heroInputRef.current?.focus({ preventScroll: true });
    });
  }, []);

  useEffect(() => {
    if (!setHomepageFooterInFlow) return;

    const debateActive = phase !== "idle";
    setHomepageFooterInFlow(!debateActive);

    if (debateActive) {
      document.documentElement.classList.add("homepage-debate-active");
    } else {
      document.documentElement.classList.remove("homepage-debate-active");
    }

    return () => {
      setHomepageFooterInFlow(true);
      document.documentElement.classList.remove("homepage-debate-active");
    };
  }, [phase, setHomepageFooterInFlow]);

  const clearTimeouts = useCallback(() => {
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
  }, []);

  const scheduleAgentMessages = useCallback(() => {
    if (agentsScheduledRef.current || agentMessages.length === 0) return;
    agentsScheduledRef.current = true;
    clearTimeouts();

    const { turns, ctaDelayMs } = buildDebateTurnTimings(
      agentMessages.map((message) => message.author),
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
  }, [agentMessages, clearTimeouts]);

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
    setAgentMessages([]);
    setVisibleAgentCount(0);
    setShowGroupFormation(false);
    setTypingAgent(null);
    setTypingFadingOut(false);
    setShowCta(false);
    setChatSaved(false);
    setIsSavingChat(false);
    setSaveErrorMessage(null);
    setValidationMessage(null);
    setSubmitStage("idle");
    submitInFlightRef.current = false;
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
    // Skip autofocus on touch/mobile devices: focusing on load pops the
    // on-screen keyboard and hides the animated placeholder. Pointer-based
    // devices (desktop) keep autofocus. A media query avoids brittle UA checks.
    const isTouchDevice =
      typeof window !== "undefined" &&
      typeof window.matchMedia === "function" &&
      window.matchMedia("(hover: none) and (pointer: coarse)").matches;
    if (isTouchDevice) return;
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

  const handleBeliefChange = useCallback((value: string) => {
    setBelief(value);
    if (validationMessage) setValidationMessage(null);
  }, [validationMessage]);

  async function validateBeliefInput(rawBelief: string): Promise<BeliefValidationResult> {
    const response = await fetch("/api/beliefs/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        belief: rawBelief,
        anonymousToken: getAnonymousSessionToken(),
      }),
    });

    await throwIfRateLimited(response);

    if (!response.ok) {
      throw new Error("Belief validation failed.");
    }

    return (await response.json()) as BeliefValidationResult;
  }

  async function generateDebateMessages(
    rawBelief: string,
    validation: BeliefValidationResult,
  ): Promise<ChatMessage[]> {
    const response = await fetch("/api/debate/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        belief: rawBelief,
        validation,
        anonymousToken: getAnonymousSessionToken(),
      }),
    });

    await throwIfRateLimited(response);

    if (!response.ok) {
      throw new Error("Debate generation failed.");
    }

    const result = (await response.json()) as DebateGenerationResult;
    if (!result.ok || result.messages.length === 0) {
      throw new Error(result.error || "Debate generation failed.");
    }

    return result.messages;
  }

  async function handleSubmit() {
    const submitAttemptId = submitAttemptIdRef.current + 1;
    submitAttemptIdRef.current = submitAttemptId;
    const trimmed = belief.trim();
    logHomepageFlow("submit started", {
      submitAttemptId,
      phase,
      isPostSubmit,
      submitStage,
      submitInFlight: submitInFlightRef.current,
      beliefLength: trimmed.length,
    });

    if (
      !trimmed ||
      isPostSubmit ||
      submitStage !== "idle" ||
      submitInFlightRef.current
    ) {
      logHomepageFlow("submit ignored by guard", {
        submitAttemptId,
        hasBelief: Boolean(trimmed),
        phase,
        isPostSubmit,
        submitStage,
        submitInFlight: submitInFlightRef.current,
      });
      return;
    }

    if (!authenticated && !canGuestCreateBelief()) {
      logHomepageFlow("guest quota blocked before AI", { submitAttemptId });
      setValidationMessage(GUEST_LIMIT_MESSAGE);
      return;
    }

    submitInFlightRef.current = true;
    setSubmitStage("validating");
    setValidationMessage(null);

    let validation: BeliefValidationResult;
    try {
      logHomepageFlow("validation request start", { submitAttemptId });
      validation = await validateBeliefInput(trimmed);
    } catch (error) {
      logHomepageFlow("validation request failed", { submitAttemptId });
      setValidationMessage(
        error instanceof Error ? error.message : VALIDATION_ERROR_MESSAGE,
      );
      resetSubmitFlow();
      return;
    }

    logHomepageFlow("validation returned", {
      submitAttemptId,
      ok: validation.ok,
      reason: validation.reason,
      message: validation.message,
      isDebatable: validation.isDebatable,
      hasNormalizedBelief: Boolean(validation.normalizedBelief?.trim()),
    });

    if (!validation.ok) {
      setValidationMessage(validation.message || VALIDATION_ERROR_MESSAGE);
      resetSubmitFlow();
      return;
    }

    try {
      const normalizedBelief =
        typeof validation.normalizedBelief === "string"
          ? validation.normalizedBelief.trim()
          : "";
      const acceptedBelief = normalizedBelief || trimmed;

      setSubmitStage("generating");

      let nextAgentMessages = buildFallbackAgentMessages(acceptedBelief);
      try {
        logHomepageFlow("requesting opening debate", { submitAttemptId });
        nextAgentMessages = await generateDebateMessages(acceptedBelief, validation);
        logHomepageFlow("opening debate returned", {
          submitAttemptId,
          messageCount: nextAgentMessages.length,
        });
      } catch (error) {
        if (error instanceof Error && error.message) {
          setValidationMessage(error.message);
          resetSubmitFlow();
          return;
        }
        logHomepageFlow("opening debate failed; using fallback", {
          submitAttemptId,
        });
        nextAgentMessages = buildFallbackAgentMessages(acceptedBelief);
      }

      if (!authenticated) {
        recordGuestBeliefCreated();
      }

      setBelief(acceptedBelief);
      setLockedBelief(acceptedBelief);
      setAgentMessages(nextAgentMessages);
      setVisibleAgentCount(0);
      setShowGroupFormation(false);
      setTypingAgent(null);
      setTypingFadingOut(false);
      setShowCta(false);
      agentsScheduledRef.current = false;
      setBelieveCount(0);
      setCopeCount(0);
      setUserVote(null);
      setMoveOffsetPx(0);
      setValidationMessage(null);
      setSubmitStage("opening");
      submitInFlightRef.current = false;
      logHomepageFlow("starting debate transition", {
        submitAttemptId,
        phase: "belief-created",
      });
      setPhase("belief-created");
    } catch (error) {
      logHomepageFlow("post-validation flow failed", {
        submitAttemptId,
        errorName: error instanceof Error ? error.name : "unknown",
        errorMessage: error instanceof Error ? error.message : "unknown",
      });
      setValidationMessage(VALIDATION_ERROR_MESSAGE);
      resetSubmitFlow();
    }
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

  const handleSaveChat = useCallback(async () => {
    if (!lockedBelief || chatSaved || isSavingChat) return;

    const messages: ChatMessage[] = [
      {
        id: "user",
        author: USER_DISPLAY_NAME,
        text: lockedBelief,
        isUser: true,
      },
      ...agentMessages,
    ];

    setIsSavingChat(true);
    setSaveErrorMessage(null);

    try {
      const response = await authFetch("/api/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          anonymousToken: getAnonymousSessionToken(),
          belief: lockedBelief,
          messages,
          attentionRemaining: MAX_ROOM_ATTENTION,
        }),
      });

      if (!response.ok) {
        if (response.status === 429) {
          setIsSavingChat(false);
          setSaveErrorMessage(await readRateLimitMessage(response));
          return;
        }
        throw new Error("DB room save failed.");
      }

      const result = (await response.json()) as SaveRoomResponse;
      if (!result.ok || !result.slug) {
        throw new Error(result.error || "DB room save failed.");
      }

      if (result.room) {
        prependRecentBelief(recentBeliefFromSavedRoom(result.room));
        void refetchRecentBeliefs();
      }

      setChatSaved(true);
      router.push(`/room/${result.slug}`);
      return;
    } catch {
      // Preserve the existing local-only room flow if DB persistence fails.
    }

    const saved = saveConversation({
      belief: lockedBelief,
      messages,
      userVote,
      believeCount,
      copeCount,
    });

    setChatSaved(true);
    router.push(`/room/${saved.slug}`);
  }, [
    lockedBelief,
    chatSaved,
    isSavingChat,
    agentMessages,
    router,
    userVote,
    believeCount,
    copeCount,
    authFetch,
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
      <HomepageBackground />
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
            isSavingChat={isSavingChat}
          />
        ) : (
          <div className="mx-auto flex w-full max-w-md min-h-home-idle flex-col justify-center px-4 py-8 pb-[calc(2rem+var(--scroll-bottom-inset))] md:pb-8">
            <div
                className={`mb-6 transition-[opacity,filter,transform] duration-500 ease-out ${
                  phase === "idle"
                    ? "scale-100 opacity-100 blur-0"
                    : "pointer-events-none scale-[0.98] opacity-0 blur-sm"
                }`}
              >
                <div className="flex flex-col items-center text-center">
                  <HeroMedia />
                  <h1 className="mb-3 text-[1.75rem] font-semibold leading-tight tracking-tight text-white drop-shadow-[0_1px_10px_rgb(0_0_0/0.22)] sm:text-3xl md:text-4xl">
                    What do you believe?
                  </h1>
                </div>
              </div>

              {isDetaching && submitStage === "opening" && (
                <BeliefProcessingStatus stage="opening" />
              )}

              {isDetaching && (
                <div
                  ref={beliefRef}
                  onTransitionEnd={handleBeliefTransitionEnd}
                  className="relative left-1/2 mb-4 will-change-transform transition-transform ease-in-out"
                  style={{
                    width: "min(28rem, calc(100vw - 2rem))",
                    transform: `translate3d(-50%, ${moveOffsetPx}px, 0)`,
                    transitionDuration: `${MOVE_DURATION_MS}ms`,
                  }}
                >
                  <ChatMessageRow message={userMessage} animate={false} />
                </div>
              )}

              <div
                className={`transition-[opacity,filter,transform] duration-300 ease-out ${
                  phase === "idle"
                    ? "scale-100 opacity-100 blur-0"
                    : "pointer-events-none scale-[0.98] opacity-0 blur-sm"
                }`}
              >
                {isGuestBlocked ? (
                  <GuestBeliefGate />
                ) : (
                  <>
                    {(submitStage === "validating" ||
                      submitStage === "generating") && (
                      <BeliefProcessingStatus stage={submitStage} />
                    )}
                    <BeliefInput
                      ref={heroInputRef}
                      value={belief}
                      onChange={handleBeliefChange}
                      onSubmit={handleSubmit}
                      disabled={isPostSubmit || isSubmitProcessing}
                      isProcessing={isSubmitProcessing && phase === "idle"}
                      animateExamples={phase === "idle" && !isSubmitProcessing}
                    />
                    <p
                      className={`mt-2 min-h-4 text-center text-xs leading-relaxed drop-shadow-[0_1px_8px_rgb(0_0_0/0.18)] sm:text-sm ${
                        validationMessage
                          ? "text-orange-100/85"
                          : "text-white/65 dark:text-white/60"
                      }`}
                      role={validationMessage ? "alert" : undefined}
                    >
                      {validationMessage ||
                        "Share a belief. Let the AI agents debate it."}
                    </p>
                  </>
                )}
              </div>
              {phase === "idle" && !isGuestBlocked && (
                <RecentConversationsPreview
                  initialBeliefs={initialRecentBeliefs}
                />
              )}
          </div>
        )}
        </main>
      </div>

      {saveErrorMessage && (
        <div
          className="pointer-events-none fixed inset-x-0 bottom-[calc(6rem+var(--mobile-bottom-nav-offset))] z-50 flex justify-center px-4 md:bottom-24"
          role="alert"
          aria-live="polite"
        >
          <p className="rounded-full border border-orange-200/80 bg-background/95 px-4 py-2 text-sm font-medium text-orange-800 shadow-lg backdrop-blur-sm dark:border-orange-400/20 dark:bg-background/95 dark:text-orange-100">
            {saveErrorMessage}
          </p>
        </div>
      )}
    </div>
  );
}
