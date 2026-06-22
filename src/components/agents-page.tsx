"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import {
  getAgentAvatarGradient,
  getAgentAvatarSrc,
} from "./avatar-placeholder";
import { InnerPageShell } from "./inner-page-shell";
import { AGENT_PROFILES } from "@/lib/agent-profiles";

function AgentPortrait({ name }: { name: string }) {
  const [imageFailed, setImageFailed] = useState(false);
  const src = getAgentAvatarSrc(name);
  const gradient = getAgentAvatarGradient(name);

  if (!src || imageFailed) {
    return (
      <div
        className={`flex size-28 items-center justify-center rounded-2xl bg-gradient-to-br text-3xl font-semibold text-white sm:size-32 ${gradient}`}
        aria-hidden
      >
        {name.charAt(0)}
      </div>
    );
  }

  return (
    <div className="size-28 overflow-hidden rounded-2xl sm:size-32">
      <Image
        src={src}
        alt=""
        width={128}
        height={128}
        className="size-full object-cover"
        onError={() => setImageFailed(true)}
      />
    </div>
  );
}

function AgentDossierCard({
  slug,
  name,
  rosterRole,
  blindSpot,
}: {
  slug: string;
  name: string;
  rosterRole: string;
  blindSpot: string;
}) {
  return (
    <Link
      href={`/agents/${slug}`}
      className="group flex flex-col items-center rounded-2xl border border-zinc-200/80 bg-surface/50 px-5 py-8 text-center transition-[border-color,background-color,box-shadow] duration-150 ease-out hover:border-[#fc8401]/35 hover:bg-surface hover:shadow-[0_0_28px_-10px_rgb(252_132_1/0.22)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#fc8401]/30 motion-reduce:transition-none dark:border-white/[0.06] dark:bg-surface/40 dark:hover:border-[#fc8401]/30 dark:hover:bg-surface/80 dark:hover:shadow-[0_0_28px_-10px_rgb(252_132_1/0.14)]"
    >
      <div className="mb-5 transition-[filter,transform] duration-150 ease-out group-hover:scale-[1.03] group-hover:brightness-110 motion-reduce:transition-none motion-reduce:group-hover:transform-none">
        <AgentPortrait name={name} />
      </div>

      <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-zinc-900 dark:text-zinc-50">
        {name}
      </h2>

      <p className="mt-3 max-w-[16rem] text-[15px] leading-snug text-zinc-800 dark:text-zinc-200">
        {blindSpot}
      </p>

      <p className="mt-2 text-sm leading-relaxed text-zinc-500 dark:text-zinc-500">
        {rosterRole}
      </p>

      <span className="mt-6 inline-flex items-center gap-1 text-[11px] font-medium text-zinc-500 transition-[color,transform] duration-150 ease-out group-hover:translate-x-0.5 group-hover:text-[#fc8401] motion-reduce:transition-none motion-reduce:group-hover:transform-none dark:text-zinc-500 dark:group-hover:text-[#fc8401]">
        View Profile
        <span aria-hidden>→</span>
      </span>
    </Link>
  );
}

export function AgentsPage() {
  return (
    <InnerPageShell topFade>
      <div className="inner-page-content !pb-10">
        <header className="text-center">
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-zinc-500 dark:text-zinc-500">
            Agents
          </p>
          <div className="mx-auto mt-5 max-w-[22rem] space-y-3 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
            <p>
              The Cope Engine is powered by a collection of personalities.
            </p>
            <p>
              Each sees the world differently.
              <br />
              Each has blind spots.
              <br />
              None of them decide what&apos;s true.
            </p>
            <p className="text-zinc-500 dark:text-zinc-500">
              Select an agent to learn how they think.
            </p>
          </div>
        </header>

        <ul className="mt-10 space-y-4">
          {AGENT_PROFILES.map((profile) => (
            <li key={profile.slug}>
              <AgentDossierCard
                slug={profile.slug}
                name={profile.name}
                rosterRole={profile.rosterRole}
                blindSpot={profile.blindSpot}
              />
            </li>
          ))}
        </ul>

        <p className="mt-8 text-center text-[11px] leading-relaxed text-zinc-500 dark:text-zinc-600">
          More agents are being trained.
        </p>
      </div>
    </InnerPageShell>
  );
}
