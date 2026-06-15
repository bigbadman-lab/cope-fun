"use client";

import Image from "next/image";
import { useState } from "react";

export const USER_DISPLAY_NAME = "You";

const AVATAR_COLORS: Record<string, string> = {
  "Cope Engine": "from-emerald-500 to-teal-700",
  Mason: "from-orange-500 to-red-600",
  Victor: "from-sky-500 to-blue-700",
  Logan: "from-amber-400 to-orange-600",
  Theo: "from-pink-500 to-rose-700",
};

const AGENT_AVATARS: Record<string, string> = {
  "Cope Engine": "/engine.png",
  Mason: "/mason.png",
  Victor: "/victor.png",
  Logan: "/logan.png",
  Theo: "/theo.png",
};

const AVATAR_CLASS =
  "size-11 shrink-0 overflow-hidden rounded-lg sm:size-[52px]";

type AvatarPlaceholderProps = {
  name: string;
};

// Future: uploaded profile → Privy/social → identicon → initial fallback
function GuestAvatar() {
  return (
    <div
      className={`relative bg-zinc-950 ${AVATAR_CLASS}`}
      aria-hidden
    >
      <div className="absolute inset-0 bg-gradient-to-br from-orange-950/70 via-zinc-900 to-zinc-950" />
      <div className="absolute inset-[18%] rounded-md bg-gradient-to-tr from-orange-600/25 to-orange-900/10" />
      <div className="absolute bottom-[22%] left-[24%] size-[28%] rounded-full bg-orange-500/20" />
      <div className="absolute right-[20%] top-[26%] size-[22%] rounded-sm bg-zinc-700/40" />
    </div>
  );
}

function GradientPlaceholder({ name }: AvatarPlaceholderProps) {
  const gradient = AVATAR_COLORS[name] ?? "from-zinc-500 to-zinc-700";

  return (
    <div
      className={`flex items-center justify-center bg-gradient-to-br text-sm font-semibold text-white ${AVATAR_CLASS} ${gradient}`}
      aria-hidden
    >
      {name.charAt(0)}
    </div>
  );
}

const MINI_AVATAR_CLASS = "size-7 shrink-0 overflow-hidden rounded-md";

type MiniAvatarProps = {
  name: string;
  className?: string;
};

export function MiniAvatar({ name, className = "" }: MiniAvatarProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const src = AGENT_AVATARS[name];

  if (name === USER_DISPLAY_NAME) {
    return (
      <div
        className={`relative bg-zinc-800 ring-2 ring-background ${MINI_AVATAR_CLASS} ${className}`}
        aria-hidden
      >
        <div className="absolute inset-0 bg-gradient-to-br from-orange-950/70 via-zinc-900 to-zinc-950" />
      </div>
    );
  }

  if (!src || imageFailed) {
    const gradient = AVATAR_COLORS[name] ?? "from-zinc-500 to-zinc-700";
    return (
      <div
        className={`flex items-center justify-center bg-gradient-to-br text-[10px] font-semibold text-white ring-2 ring-background ${MINI_AVATAR_CLASS} ${gradient} ${className}`}
        aria-hidden
      >
        {name.charAt(0)}
      </div>
    );
  }

  return (
    <div
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
    </div>
  );
}

type ParticipantAvatarStackProps = {
  participants: string[];
  max?: number;
};

export function ParticipantAvatarStack({
  participants,
  max = 4,
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
          className={index > 0 ? "-ml-2" : ""}
        />
      ))}
    </div>
  );
}

export function AvatarPlaceholder({ name }: AvatarPlaceholderProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const src = AGENT_AVATARS[name];

  if (name === USER_DISPLAY_NAME) {
    return <GuestAvatar />;
  }

  if (!src || imageFailed) {
    return <GradientPlaceholder name={name} />;
  }

  return (
    <div className={`relative ${AVATAR_CLASS}`}>
      <Image
        src={src}
        alt=""
        width={52}
        height={52}
        className="size-full object-cover"
        onError={() => setImageFailed(true)}
      />
    </div>
  );
}
