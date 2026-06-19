"use client";

import { getAvatarPreset } from "@/lib/avatar-presets";
import {
  useActiveUserProfile,
  type UserAvatar,
} from "@/lib/user-profile";

const SIZE_CLASS = {
  sm: "size-10 rounded-lg",
  md: "size-11 rounded-lg sm:size-[52px]",
  lg: "size-16 rounded-xl",
  mini: "size-7 rounded-md",
} as const;

type UserAvatarVisualProps = {
  avatar?: UserAvatar | null;
  size?: keyof typeof SIZE_CLASS;
  className?: string;
};

function GuestAvatarVisual({
  size,
  className = "",
}: {
  size: keyof typeof SIZE_CLASS;
  className?: string;
}) {
  const sizeClass = SIZE_CLASS[size];

  return (
    <div
      className={`relative shrink-0 overflow-hidden bg-zinc-950 ${sizeClass} ${className}`}
      aria-hidden
    >
      <div className="absolute inset-0 bg-gradient-to-br from-orange-950/70 via-zinc-900 to-zinc-950" />
      <div className="absolute inset-[18%] rounded-md bg-gradient-to-tr from-orange-600/25 to-orange-900/10" />
      <div className="absolute bottom-[22%] left-[24%] size-[28%] rounded-full bg-orange-500/20" />
      <div className="absolute right-[20%] top-[26%] size-[22%] rounded-sm bg-zinc-700/40" />
    </div>
  );
}

function PresetAvatarVisual({
  presetId,
  size,
  className = "",
}: {
  presetId: string;
  size: keyof typeof SIZE_CLASS;
  className?: string;
}) {
  const preset = getAvatarPreset(presetId);
  const sizeClass = SIZE_CLASS[size];

  if (!preset) {
    return <GuestAvatarVisual size={size} className={className} />;
  }

  return (
    <div
      className={`relative shrink-0 overflow-hidden ${sizeClass} ${className}`}
      aria-hidden
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${preset.gradient}`} />
      <div className={`absolute ${preset.accentA}`} />
      {preset.accentB && <div className={`absolute ${preset.accentB}`} />}
    </div>
  );
}

function UploadAvatarVisual({
  dataUrl,
  size,
  className = "",
}: {
  dataUrl: string;
  size: keyof typeof SIZE_CLASS;
  className?: string;
}) {
  const sizeClass = SIZE_CLASS[size];

  return (
    <img
      src={dataUrl}
      alt=""
      className={`shrink-0 object-cover ${sizeClass} ${className}`}
    />
  );
}

export function UserAvatarVisual({
  avatar,
  size = "md",
  className = "",
}: UserAvatarVisualProps) {
  if (!avatar || avatar.type === "default") {
    return <GuestAvatarVisual size={size} className={className} />;
  }

  if (avatar.type === "preset") {
    return (
      <PresetAvatarVisual
        presetId={avatar.presetId}
        size={size}
        className={className}
      />
    );
  }

  return (
    <UploadAvatarVisual dataUrl={avatar.dataUrl} size={size} className={className} />
  );
}

/** Resolves the active connected user's avatar for chat rendering. */
export function ConnectedUserAvatarVisual({
  size = "md",
  className = "",
}: {
  size?: keyof typeof SIZE_CLASS;
  className?: string;
}) {
  const profile = useActiveUserProfile();
  const avatar = profile?.avatar ?? { type: "default" as const };

  return <UserAvatarVisual avatar={avatar} size={size} className={className} />;
}
