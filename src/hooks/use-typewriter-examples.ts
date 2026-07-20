"use client";

import { useEffect, useState } from "react";

export const EXAMPLE_BELIEFS = [
  "robinhood chain will outperform solana this year",
  "a robinhood chain memecoin will hit a $1b market cap",
  "vlad tenev will post about robinhood chain this week",
  "tokenized stocks will become crypto's biggest narrative",
  "robinhood chain will become the home of onchain rwas",
  "a major consumer app will launch on robinhood chain",
  "robinhood chain activity will surge before august ends",
  "the next major memecoin cycle will happen on robinhood chain",
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
