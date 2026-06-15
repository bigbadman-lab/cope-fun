"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

const MEDIA_WRAPPER_CLASS = "mb-8 aspect-[2/1] w-24 sm:w-28 md:w-32";
const FALLBACK_IMAGE_CLASS = "h-full w-full object-contain";
const VIDEO_CLASS = "h-full w-full object-contain";

export function HeroMedia() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [useFallback, setUseFallback] = useState(false);

  useEffect(() => {
    if (useFallback) return;

    const video = videoRef.current;
    if (!video) return;

    const handleError = () => setUseFallback(true);

    const tryPlay = () => {
      void video.play().catch(() => setUseFallback(true));
    };

    video.addEventListener("error", handleError);
    video.addEventListener("loadeddata", tryPlay);

    if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
      tryPlay();
    }

    return () => {
      video.removeEventListener("error", handleError);
      video.removeEventListener("loadeddata", tryPlay);
    };
  }, [useFallback]);

  if (useFallback) {
    return (
      <div className={MEDIA_WRAPPER_CLASS}>
        <Image
          src="/logomain.png"
          alt=""
          width={150}
          height={75}
          className={FALLBACK_IMAGE_CLASS}
          priority
        />
      </div>
    );
  }

  return (
    <div className={MEDIA_WRAPPER_CLASS}>
      <video
        ref={videoRef}
        src="/cope-vid.mp4"
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        aria-hidden
        className={VIDEO_CLASS}
        onError={() => setUseFallback(true)}
      />
    </div>
  );
}
