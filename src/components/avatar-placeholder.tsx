"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { getAgentProfilePath } from "@/lib/agent-profiles";
import { RoomYouAvatar } from "./room-you-avatar";

export const USER_DISPLAY_NAME = "You";

const AVATAR_COLORS: Record<string, string> = {
  "Cope Engine": "from-emerald-500 to-teal-700",
  Mason: "from-orange-500 to-red-600",
  Victor: "from-sky-500 to-blue-700",
  Logan: "from-amber-400 to-orange-600",
  Theo: "from-pink-500 to-rose-700",
};

const AGENT_AVATARS: Record<string, string> = {
  "Cope Engine": "/engine2.png",
  Mason: "/mason.png",
  Victor: "/victor.png",
  Logan: "/logan.png",
  Theo: "/theo.png",
};

export function getAgentAvatarSrc(name: string): string | undefined {
  return AGENT_AVATARS[name];
}

export function getAgentAvatarGradient(name: string): string {
  return AVATAR_COLORS[name] ?? "from-zinc-500 to-zinc-700";
}

const AVATAR_CLASS =
  "size-11 shrink-0 overflow-hidden rounded-lg sm:size-[52px]";

const CLICKABLE_AVATAR_CLASS =
  "cursor-pointer transition-[opacity,transform] duration-150 hover:opacity-90 sm:hover:scale-[1.03]";

type AvatarPlaceholderProps = {
  name: string;
  linkable?: boolean;
};

type AvatarLinkWrapperProps = {
  name: string;
  className?: string;
  linkable?: boolean;
  children: React.ReactNode;
};

function AvatarLinkWrapper({
  name,
  className = "",
  linkable = true,
  children,
}: AvatarLinkWrapperProps) {
  const href = getAgentProfilePath(name);

  if (!linkable || !href) {
    return <div className={className}>{children}</div>;
  }

  return (
    <Link
      href={href}
      aria-label={`View ${name}'s profile`}
      className={`${CLICKABLE_AVATAR_CLASS} ${className}`}
    >
      {children}
    </Link>
  );
}

function GradientPlaceholder({ name, linkable = true }: AvatarPlaceholderProps) {
  const gradient = AVATAR_COLORS[name] ?? "from-zinc-500 to-zinc-700";

  return (
    <AvatarLinkWrapper name={name} linkable={linkable} className={AVATAR_CLASS}>
      <div
        className={`flex size-full items-center justify-center bg-gradient-to-br text-sm font-semibold text-white ${gradient}`}
        aria-hidden
      >
        {name.charAt(0)}
      </div>
    </AvatarLinkWrapper>
  );
}

const MINI_AVATAR_CLASS = "size-7 shrink-0 overflow-hidden rounded-md";

type MiniAvatarProps = {
  name: string;
  className?: string;
  linkable?: boolean;
};

export function MiniAvatar({
  name,
  className = "",
  linkable = true,
}: MiniAvatarProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const src = AGENT_AVATARS[name];

  if (name === USER_DISPLAY_NAME) {
    return (
      <RoomYouAvatar
        size="room-mini"
        className={`ring-2 ring-background ${className}`}
      />
    );
  }

  if (!src || imageFailed) {
    const gradient = AVATAR_COLORS[name] ?? "from-zinc-500 to-zinc-700";
    return (
      <AvatarLinkWrapper
        name={name}
        linkable={linkable}
        className={`ring-2 ring-background ${MINI_AVATAR_CLASS} ${className}`}
      >
        <div
          className={`flex size-full items-center justify-center bg-gradient-to-br text-[10px] font-semibold text-white ${gradient}`}
          aria-hidden
        >
          {name.charAt(0)}
        </div>
      </AvatarLinkWrapper>
    );
  }

  return (
    <AvatarLinkWrapper
      name={name}
      linkable={linkable}
      className={`relative ring-2 ring-background ${MINI_AVATAR_CLASS} ${className}`}
    >
      <Image
        src={src}
        alt=""
        width={28}
        height={28}
        className="size-full object-cover"
        onError={() => setImageFailed(true)}
      />
    </AvatarLinkWrapper>
  );
}

type ParticipantAvatarStackProps = {
  participants: string[];
  max?: number;
  linkable?: boolean;
};

export function ParticipantAvatarStack({
  participants,
  max = 4,
  linkable = true,
}: ParticipantAvatarStackProps) {
  const agents = participants
    .filter((name) => name !== USER_DISPLAY_NAME)
    .slice(0, max);

  if (agents.length === 0) {
    return <MiniAvatar name={USER_DISPLAY_NAME} />;
  }

  return (
    <div className="flex items-center">
      {agents.map((name, index) => (
        <MiniAvatar
          key={name}
          name={name}
          linkable={linkable}
          className={index > 0 ? "-ml-2" : ""}
        />
      ))}
    </div>
  );
}

export function AvatarPlaceholder({
  name,
  linkable = true,
}: AvatarPlaceholderProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const src = AGENT_AVATARS[name];

  if (name === USER_DISPLAY_NAME) {
    return <RoomYouAvatar size="room" />;
  }

  if (!src || imageFailed) {
    return <GradientPlaceholder name={name} linkable={linkable} />;
  }

  return (
    <AvatarLinkWrapper
      name={name}
      linkable={linkable}
      className={`relative ${AVATAR_CLASS}`}
    >
      <Image
        src={src}
        alt=""
        width={52}
        height={52}
        className="size-full object-cover"
        onError={() => setImageFailed(true)}
      />
    </AvatarLinkWrapper>
  );
}
