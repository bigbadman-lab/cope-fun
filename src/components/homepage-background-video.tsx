"use client";

import { useEffect, useRef, useState } from "react";

const FALLBACK_CLASS =
  "absolute inset-0 bg-gradient-to-b from-zinc-100 via-background to-zinc-200/70 dark:from-zinc-950 dark:via-black dark:to-zinc-950";

const DESKTOP_ONLY = "max-md:hidden md:block md:motion-reduce:hidden";

export function HomepageBackgroundVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || failed) return;

    const tryPlay = () => {
      void video.play().catch(() => {});
    };

    tryPlay();

    if (video.readyState >= 2) return;

    video.addEventListener("loadeddata", tryPlay, { once: true });
    return () => video.removeEventListener("loadeddata", tryPlay);
  }, [failed]);

  if (failed) {
    return (
      <div
        className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
        aria-hidden
      >
        <div className={FALLBACK_CLASS} />
      </div>
    );
  }

  return (
    <div
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
      aria-hidden
    >
      {/* Mobile + reduced-motion fallback */}
      <div
        className={`${FALLBACK_CLASS} block md:hidden md:motion-reduce:block`}
      />

      <video
        ref={videoRef}
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        src="/videos/cope-bg.mp4"
        aria-hidden="true"
        onError={() => setFailed(true)}
        className={`absolute inset-0 h-[100dvh] w-full max-w-none scale-[1.02] object-cover opacity-[0.3] saturate-[0.85] ${DESKTOP_ONLY}`}
      />

      <div
        className={`absolute inset-0 bg-black/25 dark:bg-black/40 ${DESKTOP_ONLY}`}
      />

      <div
        className={`absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/30 dark:from-black/35 dark:to-black/45 ${DESKTOP_ONLY}`}
      />

      <div
        className={`absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_55%,rgb(0_0_0/0.22)_100%)] dark:bg-[radial-gradient(ellipse_at_center,transparent_50%,rgb(0_0_0/0.35)_100%)] ${DESKTOP_ONLY}`}
      />
    </div>
  );
}
