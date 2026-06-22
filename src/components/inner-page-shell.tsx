"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { TopNav } from "./top-nav";

type InnerPageShellProps = {
  children?: React.ReactNode;
  variant?: "scroll" | "room";
  mainClassName?: string;
  centerMain?: boolean;
  topFade?: boolean;
};

export function InnerPageShell({
  children,
  variant = "scroll",
  mainClassName = "",
  centerMain = false,
  topFade = false,
}: InnerPageShellProps) {
  const pathname = usePathname();
  const mainRef = useRef<HTMLElement>(null);

  useEffect(() => {
    mainRef.current?.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [pathname]);

  if (variant === "room") {
    return (
      <div className="inner-page-shell-room">
        <TopNav />
        <main ref={mainRef} className={`inner-page-main-room ${mainClassName}`.trim()}>
          {children}
        </main>
      </div>
    );
  }

  const mainClasses = [
    "inner-page-main",
    centerMain ? "flex flex-col items-center justify-center text-center" : "",
    mainClassName,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="inner-page-shell">
      <TopNav />
      {topFade && (
        <div
          aria-hidden
          className="pointer-events-none fixed inset-x-0 top-0 z-40 h-[calc(var(--nav-height)+3rem+env(safe-area-inset-top,0px))] bg-gradient-to-b from-background via-background/95 to-background/0"
        />
      )}
      <main ref={mainRef} className={mainClasses}>
        {children}
      </main>
    </div>
  );
}
