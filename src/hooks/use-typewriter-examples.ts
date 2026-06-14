"use client";

import { useEffect, useState } from "react";

export const EXAMPLE_BELIEFS = [
  "solana will ath in 2026",
  "travelling for 6 months is better than starting a career",
  "remote work is dead",
  "university is mostly a scam",
  "most people are too late to buy a house",
  "ethereum has lost its edge",
  "the future belongs to small teams",
  "social media is getting worse",
] as const;

const PAUSE_AFTER_COMPLETE_MS = 2000;

function typingDelayMs(): number {
  return 35 + Math.random() * 50;
}

function deletingDelayMs(): number {
  return 16 + Math.random() * 24;
}

export function useTypewriterExamples(enabled: boolean): string {
  const [text, setText] = useState("");

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout>;
    let exampleIndex = 0;
    let charIndex = 0;
    let mode: "type" | "pause" | "delete" = "type";

    const run = () => {
      if (cancelled) return;

      const example = EXAMPLE_BELIEFS[exampleIndex];

      if (mode === "type") {
        if (charIndex < example.length) {
          charIndex += 1;
          setText(example.slice(0, charIndex));
          timeoutId = setTimeout(run, typingDelayMs());
        } else {
          mode = "pause";
          timeoutId = setTimeout(run, PAUSE_AFTER_COMPLETE_MS);
        }
        return;
      }

      if (mode === "pause") {
        mode = "delete";
        run();
        return;
      }

      if (charIndex > 0) {
        charIndex -= 1;
        setText(example.slice(0, charIndex));
        timeoutId = setTimeout(run, deletingDelayMs());
      } else {
        exampleIndex = (exampleIndex + 1) % EXAMPLE_BELIEFS.length;
        mode = "type";
        timeoutId = setTimeout(run, typingDelayMs());
      }
    };

    timeoutId = setTimeout(() => {
      if (cancelled) return;
      charIndex = 0;
      mode = "type";
      setText("");
      run();
    }, 400);

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [enabled]);

  return enabled ? text : "";
}
