"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";

const SLIDE_COUNT = 3;
const SWIPE_THRESHOLD_PX = 48;

type HomepageOnboardingOverlayProps = {
  onDismiss: () => void;
};

type Slide = {
  id: string;
  heading: string;
  body: ReactNode;
};

const SLIDES: Slide[] = [
  {
    id: "concept",
    heading: "Where beliefs become markets.",
    body: (
      <>
        Test your ideas with the Swarm Engine, explore what others believe, and
        take positions in prediction markets.
      </>
    ),
  },
  {
    id: "credits",
    heading: "Put your beliefs to work.",
    body: (
      <>
        Connect your wallet to receive 1,000 Swarm Credits. Use them to enter
        markets, make predictions, and climb the leaderboard.
      </>
    ),
  },
  {
    id: "rewards",
    heading: "Predict. Compete. Earn.",
    body: (
      <>
        Your performance across HoodSwarm markets can contribute towards real{" "}
        <span className="font-medium text-cope-orange">$SWARM</span> token
        rewards at the end of each season.
      </>
    ),
  },
];

function ChevronLeftIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M15 18l-6-6 6-6" />
    </svg>
  );
}

function ChevronRightIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M9 18l6-6-6-6" />
    </svg>
  );
}

export function HomepageOnboardingOverlay({
  onDismiss,
}: HomepageOnboardingOverlayProps) {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const dialogRef = useRef<HTMLDivElement>(null);
  const pointerStartXRef = useRef<number | null>(null);

  const isLastSlide = activeIndex === SLIDE_COUNT - 1;

  const goToSlide = useCallback((index: number) => {
    setActiveIndex(Math.max(0, Math.min(SLIDE_COUNT - 1, index)));
  }, []);

  const goNext = useCallback(() => {
    setActiveIndex((current) => Math.min(SLIDE_COUNT - 1, current + 1));
  }, []);

  const goPrevious = useCallback(() => {
    setActiveIndex((current) => Math.max(0, current - 1));
  }, []);

  useEffect(() => {
    let visibleFrame = 0;
    const frame = requestAnimationFrame(() => {
      setMounted(true);
      visibleFrame = requestAnimationFrame(() => setVisible(true));
    });

    return () => {
      cancelAnimationFrame(frame);
      cancelAnimationFrame(visibleFrame);
    };
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [mounted]);

  useEffect(() => {
    if (!mounted) return;

    const dialog = dialogRef.current;
    if (!dialog) return;

    dialog.focus({ preventScroll: true });

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onDismiss();
        return;
      }

      if (event.key === "ArrowRight") {
        event.preventDefault();
        if (isLastSlide) {
          onDismiss();
        } else {
          goNext();
        }
        return;
      }

      if (event.key === "ArrowLeft") {
        event.preventDefault();
        goPrevious();
      }
    }

    function handleTab(event: KeyboardEvent) {
      if (event.key !== "Tab" || !dialog) return;

      const focusable = dialog.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
      );
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keydown", handleTab);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keydown", handleTab);
    };
  }, [goNext, goPrevious, isLastSlide, mounted, onDismiss]);

  const handlePointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (event.pointerType === "mouse" && event.button !== 0) return;
      pointerStartXRef.current = event.clientX;
      event.currentTarget.setPointerCapture(event.pointerId);
    },
    [],
  );

  const handlePointerUp = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      const startX = pointerStartXRef.current;
      pointerStartXRef.current = null;

      if (startX == null) return;

      const deltaX = event.clientX - startX;
      if (Math.abs(deltaX) < SWIPE_THRESHOLD_PX) return;

      if (deltaX < 0) {
        if (isLastSlide) {
          onDismiss();
        } else {
          goNext();
        }
      } else {
        goPrevious();
      }
    },
    [goNext, goPrevious, isLastSlide, onDismiss],
  );

  const handlePointerCancel = useCallback(() => {
    pointerStartXRef.current = null;
  }, []);

  if (!mounted) return null;

  const activeSlide = SLIDES[activeIndex];

  return (
    <div
      className={`fixed inset-0 z-[65] flex items-center justify-center bg-black/55 px-4 py-6 backdrop-blur-[2px] transition-opacity duration-[280ms] ease-out motion-reduce:transition-none sm:px-6 ${
        visible ? "opacity-100" : "pointer-events-none opacity-0"
      }`}
      style={{
        paddingTop: "max(1.5rem, env(safe-area-inset-top))",
        paddingBottom: "max(1.5rem, env(safe-area-inset-bottom))",
      }}
      onClick={onDismiss}
      role="presentation"
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        className={`relative w-full max-w-md overflow-hidden rounded-2xl border border-zinc-200/80 bg-surface shadow-2xl outline-none transition-[opacity,transform] duration-[280ms] ease-out motion-reduce:transition-none dark:border-white/[0.08] dark:bg-[#0a0a0a] ${
          visible ? "translate-y-0 scale-100 opacity-100" : "translate-y-2 scale-[0.98] opacity-0"
        }`}
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="onboarding-slide-heading"
        aria-describedby="onboarding-slide-body"
      >
        <div className="flex items-center justify-end px-4 pt-4 sm:px-6 sm:pt-5">
          <button
            type="button"
            onClick={onDismiss}
            className="rounded-lg px-2 py-1 text-xs font-medium text-zinc-500 transition-colors hover:text-zinc-300"
          >
            Skip
          </button>
        </div>

        <div
          className="overflow-hidden px-5 pb-2 sm:px-7"
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerCancel}
        >
          <div
            className="flex transition-transform duration-[280ms] ease-out motion-reduce:transition-none"
            style={{ transform: `translateX(-${activeIndex * 100}%)` }}
          >
            {SLIDES.map((slide) => (
              <article
                key={slide.id}
                className="w-full shrink-0 px-1 pb-4 text-center"
                aria-hidden={slide.id !== activeSlide.id}
              >
                <h2
                  id={slide.id === activeSlide.id ? "onboarding-slide-heading" : undefined}
                  className="text-[1.35rem] font-semibold leading-tight tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-2xl"
                >
                  {slide.heading}
                </h2>
                <p
                  id={slide.id === activeSlide.id ? "onboarding-slide-body" : undefined}
                  className="mx-auto mt-3 max-w-[26rem] text-sm leading-relaxed text-zinc-600 dark:text-zinc-400 sm:text-[15px]"
                >
                  {slide.body}
                </p>
              </article>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 px-5 pb-4 sm:px-7">
          {SLIDES.map((slide, index) => (
            <button
              key={slide.id}
              type="button"
              aria-label={`Go to slide ${index + 1}`}
              aria-current={index === activeIndex ? "step" : undefined}
              onClick={() => goToSlide(index)}
              className={`h-1.5 rounded-full transition-all duration-200 motion-reduce:transition-none ${
                index === activeIndex
                  ? "w-5 bg-cope-orange"
                  : "w-1.5 bg-zinc-300 hover:bg-zinc-400 dark:bg-zinc-700 dark:hover:bg-zinc-500"
              }`}
            />
          ))}
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-zinc-200/70 px-5 py-4 dark:border-white/[0.06] sm:px-7">
          <button
            type="button"
            onClick={goPrevious}
            disabled={activeIndex === 0}
            aria-label="Previous slide"
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl text-sm font-medium text-zinc-500 transition-colors enabled:hover:text-zinc-200 disabled:cursor-default disabled:opacity-0"
          >
            <ChevronLeftIcon className="size-5" />
            <span className="sr-only">Previous</span>
          </button>

          {isLastSlide ? (
            <button
              type="button"
              onClick={onDismiss}
              className="inline-flex min-h-11 flex-1 items-center justify-center rounded-xl bg-cope-orange px-5 text-sm font-semibold text-zinc-950 transition-colors hover:bg-cope-orange/90 sm:flex-none sm:px-6"
            >
              Enter the Swarm
            </button>
          ) : (
            <button
              type="button"
              onClick={goNext}
              aria-label="Next slide"
              className="inline-flex min-h-11 flex-1 items-center justify-center gap-1 rounded-xl border border-cope-orange/30 bg-cope-orange/10 px-5 text-sm font-medium text-cope-orange transition-colors hover:bg-cope-orange/15 sm:flex-none sm:px-6"
            >
              Next
              <ChevronRightIcon className="size-4" />
            </button>
          )}

          <div className="min-w-11" aria-hidden />
        </div>
      </div>
    </div>
  );
}
