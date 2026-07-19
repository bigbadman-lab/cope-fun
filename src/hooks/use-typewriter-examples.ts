"use client";

import { useEffect, useState } from "react";

export const EXAMPLE_BELIEFS = [
  "bitcoin will hit a new ath this cycle",
  "university is mostly a scam",
  "remote work is dead",
  "ai will replace junior developers",
  "the uk housing market is broken",
  "social media is making people lonelier",
  "bitcoin will outperform every major asset",
  "the future belongs to small teams",
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
