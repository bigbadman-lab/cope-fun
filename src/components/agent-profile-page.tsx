"use client";

import Link from "next/link";
import { AnimatedConversation } from "./animated-conversation";
import { TopNav } from "./top-nav";
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
      <div className="flex min-h-full flex-col">
        <TopNav />
        <main className="flex flex-1 flex-col items-center justify-center px-4 pt-14 text-center">
          <p className="text-sm text-zinc-500">Agent not found.</p>
          <Link
            href="/agents"
            className="mt-4 text-sm font-medium text-zinc-300 transition-colors hover:text-zinc-100"
          >
            Back to Agents
          </Link>
        </main>
      </div>
    );
  }

  const profile = getAgentProfile(slug);
  const messages = getAgentConversation(slug);

  if (!profile) {
    return null;
  }

  return <AnimatedConversation messages={messages} />;
}
