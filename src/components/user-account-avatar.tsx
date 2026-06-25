"use client";

import {
  DEFAULT_AVATAR_COLOR,
  getAvatarPresetColor,
} from "@/lib/profile/avatar-colors";
import { getAccountInitials } from "@/lib/profile/account-initials";

export type UserAccountAvatarSize = "xs" | "sm" | "md" | "lg";

const SIZE_CLASSES: Record<
  UserAccountAvatarSize,
  { container: string; text: string; dot: string; dotOffset: string }
> = {
  xs: {
    container: "size-7",
    text: "text-[10px]",
    dot: "size-2",
    dotOffset: "-bottom-0.5 -right-0.5",
  },
  sm: {
    container: "size-8",
    text: "text-xs",
    dot: "size-2",
    dotOffset: "-bottom-0.5 -right-0.5",
  },
  md: {
    container: "size-10",
    text: "text-sm",
    dot: "size-2.5",
    dotOffset: "-bottom-0.5 -right-0.5",
  },
  lg: {
    container: "size-14",
    text: "text-base",
    dot: "size-2.5",
    dotOffset: "-bottom-0.5 -right-0.5",
  },
};

type UserAccountAvatarProps = {
  label: string;
  avatarColor?: string | null;
  avatarPublicUrl?: string | null;
  avatarUpdatedAt?: string | null;
  size?: UserAccountAvatarSize;
  showStatusDot?: boolean;
  className?: string;
};

export function UserAccountAvatar({
  label,
  avatarColor,
  avatarPublicUrl,
  avatarUpdatedAt,
  size = "md",
  showStatusDot = false,
  className = "",
}: UserAccountAvatarProps) {
  const initials = getAccountInitials(label);
  const preset =
    getAvatarPresetColor(avatarColor) ??
    getAvatarPresetColor(DEFAULT_AVATAR_COLOR);
  const sizeClass = SIZE_CLASSES[size];

  const imageSrc =
    avatarPublicUrl && avatarUpdatedAt
      ? `${avatarPublicUrl}?v=${encodeURIComponent(avatarUpdatedAt)}`
      : avatarPublicUrl;

  return (
    <span className={`relative inline-flex shrink-0 ${className}`}>
      {avatarPublicUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- Supabase public avatar URLs are user-specific.
        <img
          src={imageSrc ?? avatarPublicUrl}
          alt=""
          aria-hidden
          className={`${sizeClass.container} rounded-full object-cover ring-1 ring-zinc-200/70 dark:ring-white/10`}
        />
      ) : (
        <span
          className={`${sizeClass.container} flex items-center justify-center rounded-full font-semibold ${sizeClass.text}`}
          style={{
            backgroundColor: preset?.background,
            color: preset?.foreground,
          }}
          aria-hidden
        >
          {initials}
        </span>
      )}
      {showStatusDot && (
        <span
          className={`absolute ${sizeClass.dotOffset} ${sizeClass.dot} rounded-full border border-background bg-cope-orange`}
          aria-hidden
        />
      )}
    </span>
  );
}
