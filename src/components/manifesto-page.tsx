"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { AgentTurnRow, type AgentTurnMode } from "./debate-chat";
import { InnerPageShell } from "./inner-page-shell";
import { MANIFESTO_MESSAGES } from "@/lib/manifesto-content";
import { scheduleScriptedTransmission } from "@/lib/scripted-transmission-timing";

const INIT_DELAY_MS = 800;
const CLOSING_DELAY_MS = 450;
const CTA_DELAY_MS = 950;

function TransmissionStatus({
  children,
  animate = true,
}: {
  children: React.ReactNode;
  animate?: boolean;
}) {
  return (
    <p
      className={`py-1 text-center text-[11px] leading-relaxed text-zinc-500 dark:text-zinc-600 ${
        animate ? "animate-join-in" : ""
      }`}
    >
      {children}
    </p>
  );
}

export function ManifestoPage() {
  const [started, setStarted] = useState(false);
  const [agentTurns, setAgentTurns] = useState<Record<number, AgentTurnMode>>(
    {},
  );
  const [showClosing, setShowClosing] = useState(false);
  const [showCta, setShowCta] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const generationRef = useRef(0);

  useEffect(() => {
    const initTimer = window.setTimeout(() => setStarted(true), INIT_DELAY_MS);
    return () => window.clearTimeout(initTimer);
  }, []);

  useEffect(() => {
    if (!started) return;

    const generation = ++generationRef.current;

    return scheduleScriptedTransmission(MANIFESTO_MESSAGES, {
      onAgentTypingStart: (index) => {
        if (generationRef.current !== generation) return;
        setAgentTurns((current) => ({ ...current, [index]: "typing" }));
      },
      onAgentTypingFade: (index) => {
        if (generationRef.current !== generation) return;
        setAgentTurns((current) =>
          current[index] ? { ...current, [index]: "fading" } : current,
        );
      },
      onAgentMessage: (index) => {
        if (generationRef.current !== generation) return;
        setAgentTurns((current) => ({ ...current, [index]: "message" }));
      },
      onComplete: () => {
        if (generationRef.current !== generation) return;
        window.setTimeout(() => setShowClosing(true), CLOSING_DELAY_MS);
        window.setTimeout(() => setShowCta(true), CTA_DELAY_MS);
      },
    });
  }, [started]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [agentTurns, showClosing, showCta, started]);

  return (
    <InnerPageShell topFade>
      <div className="inner-page-content space-y-4">
        {!started && (
          <TransmissionStatus>Cope Engine initializing…</TransmissionStatus>
        )}

        {started &&
          MANIFESTO_MESSAGES.map((message, index) => {
            const mode = agentTurns[index];
            if (!mode) return null;

            return (
              <AgentTurnRow
                key={message.id}
                message={message}
                mode={mode}
              />
            );
          })}

        {showClosing && (
          <TransmissionStatus>Transmission complete.</TransmissionStatus>
        )}

        {showCta && (
          <div className="animate-cta-in pb-2 pt-1">
            <Link
              href="/"
              className="inline-flex min-h-11 items-center rounded-full border border-zinc-300 px-5 py-2.5 text-sm font-medium text-zinc-700 transition-colors hover:border-zinc-400 hover:bg-zinc-900/[0.04] hover:text-zinc-900 dark:border-zinc-700 dark:text-zinc-300 dark:hover:border-zinc-500 dark:hover:bg-white/[0.04] dark:hover:text-zinc-100"
            >
              Challenge a decision
            </Link>
          </div>
        )}

        <div ref={endRef} aria-hidden />
      </div>
    </InnerPageShell>
  );
}
