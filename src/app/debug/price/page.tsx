/**
 * TEMPORARY debug route — remove before Pulse launch.
 * Visual smoke test for GET /api/internal/price only.
 */
import type { Metadata } from "next";
import { LiveSolPrice } from "@/components/debug/live-sol-price";
import { InnerPageShell } from "@/components/inner-page-shell";
import { createPageMetadata } from "@/lib/metadata";

const pageMetadata = createPageMetadata({
  title: "Debug · Price",
  description: "Temporary internal debug view for live SOL/USD pricing.",
  openGraphTitle: "Debug Price",
  path: "/debug/price",
});

export const metadata: Metadata = {
  ...pageMetadata,
  robots: {
    index: false,
    follow: false,
  },
};

export default function DebugPricePage() {
  return (
    <InnerPageShell centerMain>
      <div className="mx-auto w-full max-w-md px-6 py-12">
        <div className="mb-6 rounded-lg border border-dashed border-cope-orange/40 bg-cope-orange/[0.06] px-4 py-3 text-sm text-zinc-700 dark:text-zinc-300">
          Temporary debug page. Not part of Pulse or production UX. Safe to delete
          once price-service validation is complete.
        </div>
        <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted">
          Debug only
        </p>
        <h1 className="mb-8 text-2xl font-semibold tracking-tight">Live SOL/USD</h1>
        <LiveSolPrice />
      </div>
    </InnerPageShell>
  );
}
