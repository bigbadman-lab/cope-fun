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

const MINI_AVATAR_CLASS = "size-7 shrink-0 overflow-hidden rounded-[6px]";

const FAN_CARD_LAYOUT = [
  { rotate: -14, x: 0, y: 3 },
  { rotate: -5, x: 5, y: 1 },
  { rotate: 5, x: 10, y: -1 },
  { rotate: 13, x: 15, y: -2 },
] as const;

type MiniAvatarProps = {
  name: string;
  className?: string;
  linkable?: boolean;
  ringClassName?: string;
};

export function MiniAvatar({
  name,
  className = "",
  linkable = true,
  ringClassName = "ring-2 ring-background",
}: MiniAvatarProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const src = AGENT_AVATARS[name];

  if (name === USER_DISPLAY_NAME) {
    return (
      <RoomYouAvatar
        size="room-mini"
        className={`${ringClassName} ${className}`}
      />
    );
  }

  if (!src || imageFailed) {
    const gradient = AVATAR_COLORS[name] ?? "from-zinc-500 to-zinc-700";
    return (
      <AvatarLinkWrapper
        name={name}
        linkable={linkable}
        className={`${ringClassName} ${MINI_AVATAR_CLASS} ${className}`}
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
      className={`relative ${ringClassName} ${MINI_AVATAR_CLASS} ${className}`}
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
  variant?: "default" | "homepage";
};

const STACK_RING_CLASS = {
  default:
    "ring-2 ring-background shadow-[0_2px_8px_-2px_rgba(0,0,0,0.28)] dark:shadow-[0_2px_10px_-2px_rgba(0,0,0,0.55)]",
  homepage:
    "ring-2 ring-white/90 shadow-[0_3px_10px_-2px_rgba(0,0,0,0.45)]",
} as const;

export function ParticipantAvatarStack({
  participants,
  max = 4,
  linkable = true,
  variant = "default",
}: ParticipantAvatarStackProps) {
  const agents = participants
    .filter((name) => name !== USER_DISPLAY_NAME)
    .slice(0, max);

  if (agents.length === 0) {
    return <MiniAvatar name={USER_DISPLAY_NAME} ringClassName={STACK_RING_CLASS[variant]} />;
  }

  const ringClassName = STACK_RING_CLASS[variant];

  return (
    <div
      className="relative h-9 w-11 shrink-0 sm:h-10 sm:w-12"
      role="img"
      aria-label={`Agents in room: ${agents.join(", ")}`}
    >
      {agents.map((name, index) => {
        const layout = FAN_CARD_LAYOUT[index] ?? FAN_CARD_LAYOUT[FAN_CARD_LAYOUT.length - 1];

        return (
          <div
            key={name}
            className="absolute left-0 top-1 origin-bottom-left motion-reduce:transition-none"
            style={{
              zIndex: index,
              transform: `rotate(${layout.rotate}deg) translate(${layout.x}px, ${layout.y}px)`,
            }}
          >
            <MiniAvatar
              name={name}
              linkable={linkable}
              ringClassName={ringClassName}
            />
          </div>
        );
      })}
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
