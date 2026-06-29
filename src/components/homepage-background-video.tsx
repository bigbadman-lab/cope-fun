"use client";

import Image from "next/image";
import { useState } from "react";

const BLUR_WEBP = "/backgrounds/sky1-blur.webp";
const FULL_WEBP = "/backgrounds/sky1.webp";
const FULL_JPG = "/backgrounds/sky1.jpg";

export function HomepageBackgroundVideo() {
  const [fullLoaded, setFullLoaded] = useState(false);

  return (
    <div
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
      aria-hidden
    >
      <div className="absolute inset-0 scale-[1.02]">
        <div className="relative h-full w-full">
          {/* Tiny blurred placeholder — paints immediately while the full image loads. */}
          <Image
            src={BLUR_WEBP}
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover object-center"
            unoptimized
          />

          {/* Full-resolution background — WebP with original JPG fallback. */}
          <picture className="absolute inset-0 block h-full w-full">
            <source srcSet={FULL_WEBP} type="image/webp" />
            <img
              src={FULL_JPG}
              alt=""
              decoding="async"
              onLoad={() => setFullLoaded(true)}
              className={`h-full w-full object-cover object-center transition-opacity duration-700 ease-out motion-reduce:transition-none ${
                fullLoaded ? "opacity-100" : "opacity-0"
              }`}
            />
          </picture>
        </div>
      </div>
      <div className="absolute inset-0 bg-black/15 dark:bg-black/55" />
      <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/25 to-background/90 dark:from-black/78 dark:via-black/35 dark:to-black/88" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_50%,rgb(0_0_0/0.34)_100%)] dark:bg-[radial-gradient(ellipse_at_center,transparent_46%,rgb(0_0_0/0.5)_100%)]" />
    </div>
  );
}
