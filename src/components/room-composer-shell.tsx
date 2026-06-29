import type { ReactNode } from "react";

type RoomComposerShellProps = {
  children: ReactNode;
};

export function RoomComposerShell({ children }: RoomComposerShellProps) {
  return (
    <div className="fixed inset-x-0 bottom-mobile-bottom-nav z-20 border-t border-zinc-200/80 bg-background px-4 pt-3 pb-safe-4 before:pointer-events-none before:absolute before:-top-8 before:left-0 before:right-0 before:h-8 before:bg-gradient-to-t before:from-background before:to-transparent dark:border-white/5">
      <div className="relative mx-auto w-full max-w-md">{children}</div>
    </div>
  );
}
