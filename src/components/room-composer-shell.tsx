"use client";

import { useEffect, type ReactNode } from "react";

type RoomComposerShellProps = {
  children: ReactNode;
};

/**
 * Tracks the on-screen keyboard height via the visualViewport API and exposes
 * it as the `--keyboard-inset` CSS variable. The fixed composer uses this to
 * stay docked just above the keyboard instead of being hidden behind it (which
 * previously caused the page to jump on mobile while typing).
 */
function useKeyboardInset() {
  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return;

    const root = document.documentElement;

    const update = () => {
      const overlap =
        window.innerHeight - viewport.height - viewport.offsetTop;
      // Clamp out sub-pixel jitter so a closed keyboard reads as exactly 0.
      const inset = overlap > 1 ? overlap : 0;
      root.style.setProperty("--keyboard-inset", `${inset}px`);
    };

    update();
    viewport.addEventListener("resize", update);
    viewport.addEventListener("scroll", update);

    return () => {
      viewport.removeEventListener("resize", update);
      viewport.removeEventListener("scroll", update);
      root.style.setProperty("--keyboard-inset", "0px");
    };
  }, []);
}

export function RoomComposerShell({ children }: RoomComposerShellProps) {
  useKeyboardInset();

  return (
    <div className="fixed inset-x-0 bottom-mobile-bottom-nav z-20 border-t border-zinc-200/80 bg-background px-4 pt-3 pb-safe-4 before:pointer-events-none before:absolute before:-top-8 before:left-0 before:right-0 before:h-8 before:bg-gradient-to-t before:from-background before:to-transparent dark:border-white/5">
      <div className="relative mx-auto w-full max-w-md">{children}</div>
    </div>
  );
}
