import type { Metadata } from "next";
import { CopeTokenPage } from "@/components/cope-token-page";

export const metadata: Metadata = {
  title: "$COPE",
  description:
    "What $COPE is, how it relates to COPE Credits during the first three seasons, and Cope's long-term direction toward on-chain markets.",
};

export default function CopePage() {
  return <CopeTokenPage />;
}
