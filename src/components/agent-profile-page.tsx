"use client";

import Link from "next/link";
import { AnimatedConversation } from "./animated-conversation";
import { InnerPageShell } from "./inner-page-shell";
import {
  getAgentConversation,
  getAgentProfile,
  isAgentSlug,
} from "@/lib/agent-profiles";

type AgentProfilePageProps = {
  slug: string;
};

export function AgentProfilePage({ slug }: AgentProfilePageProps) {
  if (!isAgentSlug(slug)) {
    return (
      <InnerPageShell centerMain mainClassName="px-4">
        <p className="text-sm text-zinc-500">Agent not found.</p>
        <Link
          href="/agents"
          className="mt-4 text-sm font-medium text-zinc-700 transition-colors hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-100"
        >
          Back to Agents
        </Link>
      </InnerPageShell>
    );
  }

  const profile = getAgentProfile(slug);
  const messages = getAgentConversation(slug);

  if (!profile) {
    return null;
  }

  return <AnimatedConversation messages={messages} />;
}
