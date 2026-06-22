import Link from "next/link";
import { InnerPageShell } from "./inner-page-shell";
import {
  getMockProfile,
  type MockProfile,
  type MockProfileNote,
  type MockProfilePosition,
} from "@/lib/mock-profiles";

type PublicProfilePageProps = {
  username: string;
};

function ProfileAvatar({
  initials,
  size = "lg",
}: {
  initials: string;
  size?: "lg" | "md";
}) {
  const sizeClass = size === "lg" ? "size-16 text-lg" : "size-10 text-sm";

  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-xl border border-zinc-200/80 bg-surface font-semibold text-zinc-600 dark:border-white/[0.08] dark:bg-surface/70 dark:text-zinc-300 ${sizeClass}`}
      aria-hidden
    >
      {initials}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-zinc-200/70 bg-background/60 px-3 py-2.5 dark:border-white/[0.06] dark:bg-background/35">
      <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-zinc-500">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">
        {value}
      </p>
    </div>
  );
}

function SideBadge({ side }: { side: "believe" | "cope" }) {
  const isBelieve = side === "believe";

  return (
    <span
      className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${
        isBelieve
          ? "border-emerald-300/50 bg-emerald-50/70 text-emerald-800 dark:border-emerald-900/35 dark:bg-emerald-950/15 dark:text-emerald-400/85"
          : "border-rose-300/50 bg-rose-50/70 text-rose-800 dark:border-rose-900/35 dark:bg-rose-950/15 dark:text-rose-400/85"
      }`}
    >
      {isBelieve ? "Believe" : "Cope"}
    </span>
  );
}

function SectionCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-zinc-200/80 bg-surface/50 px-4 py-4 dark:border-white/[0.07] dark:bg-surface/40">
      <h2 className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
        {title}
      </h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function PositionRow({ position }: { position: MockProfilePosition }) {
  return (
    <div className="border-b border-zinc-200/60 py-3 first:pt-0 last:border-b-0 last:pb-0 dark:border-white/[0.06]">
      <div className="flex flex-wrap items-center gap-2">
        <p className="min-w-0 flex-1 text-sm font-medium leading-snug text-zinc-900 dark:text-zinc-100">
          {position.marketTitle}
        </p>
        <SideBadge side={position.side} />
      </div>
      <p className="mt-1 text-xs text-zinc-500">
        {position.stakeAmount.toLocaleString()} credits · {position.status}
      </p>
    </div>
  );
}

function NoteRow({ note }: { note: MockProfileNote }) {
  return (
    <div className="border-b border-zinc-200/60 py-3 first:pt-0 last:border-b-0 last:pb-0 dark:border-white/[0.06]">
      <div className="flex flex-wrap items-center gap-2">
        <p className="min-w-0 flex-1 text-sm font-medium leading-snug text-zinc-900 dark:text-zinc-100">
          {note.marketTitle}
        </p>
        <SideBadge side={note.side} />
      </div>
      <p className="mt-1.5 text-[13px] leading-relaxed text-zinc-600 dark:text-zinc-400">
        {note.body}
      </p>
      <p className="mt-1 text-xs text-zinc-500">{note.createdAt}</p>
    </div>
  );
}

function ProfileContent({ profile }: { profile: MockProfile }) {
  return (
    <>
      <section className="rounded-xl border border-zinc-200/80 bg-surface/50 px-4 py-4 dark:border-white/[0.07] dark:bg-surface/40">
        <div className="flex items-start gap-4">
          <ProfileAvatar initials={profile.initials} />
          <div className="min-w-0 flex-1">
            <h1 className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
              {profile.username}
            </h1>
            <p className="mt-1.5 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
              {profile.bio}
            </p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <StatCard label="Season Rank" value={`#${profile.seasonRank}`} />
          <StatCard
            label="Season Points"
            value={profile.seasonPoints.toLocaleString()}
          />
          <StatCard
            label="COPE Credits"
            value={profile.copeCredits.toLocaleString()}
          />
          <StatCard label="Win Rate" value={`${profile.winRate}%`} />
        </div>
      </section>

      <SectionCard title="Active Positions">
        {profile.activePositions.length === 0 ? (
          <p className="text-sm text-zinc-500">No active positions.</p>
        ) : (
          profile.activePositions.map((position) => (
            <PositionRow key={position.id} position={position} />
          ))
        )}
      </SectionCard>

      <SectionCard title="Recent Conviction Notes">
        {profile.recentConvictionNotes.length === 0 ? (
          <p className="text-sm text-zinc-500">No conviction notes yet.</p>
        ) : (
          profile.recentConvictionNotes.map((note) => (
            <NoteRow key={note.id} note={note} />
          ))
        )}
      </SectionCard>

      <SectionCard title="Beliefs Created">
        {profile.beliefsCreated.length === 0 ? (
          <p className="text-sm text-zinc-500">No beliefs created yet.</p>
        ) : (
          <div className="divide-y divide-zinc-200/60 dark:divide-white/[0.06]">
            {profile.beliefsCreated.map((belief) => (
              <Link
                key={belief.id}
                href={`/room/${belief.roomSlug}`}
                className="block py-3 text-sm font-medium leading-snug text-zinc-900 transition-colors first:pt-0 last:pb-0 hover:text-zinc-700 dark:text-zinc-100 dark:hover:text-zinc-300"
              >
                {belief.text}
              </Link>
            ))}
          </div>
        )}
      </SectionCard>
    </>
  );
}

export function PublicProfilePage({ username }: PublicProfilePageProps) {
  const profile = getMockProfile(decodeURIComponent(username));

  return (
    <InnerPageShell topFade>
      <div className="inner-page-content w-full max-w-md !py-5">
        {profile ? (
          <div className="space-y-4">
            <ProfileContent profile={profile} />
          </div>
        ) : (
          <div className="flex min-h-[50vh] flex-col items-center justify-center text-center">
            <p className="text-base text-zinc-500">Profile not found.</p>
            <Link
              href="/leaderboard"
              className="mt-4 inline-flex min-h-11 items-center text-base font-medium text-zinc-700 transition-colors hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-100"
            >
              Back to Leaderboard
            </Link>
          </div>
        )}
      </div>
    </InnerPageShell>
  );
}
