"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { TopNav } from "./top-nav";

type InnerPageShellProps = {
  children?: React.ReactNode;
  variant?: "scroll" | "room";
  mainClassName?: string;
  centerMain?: boolean;
};

export function InnerPageShell({
  children,
  variant = "scroll",
  mainClassName = "",
  centerMain = false,
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
        <main className={`inner-page-main-room ${mainClassName}`.trim()}>
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
      <main ref={mainRef} className={mainClasses}>
        {children}
      </main>
    </div>
  );
}
