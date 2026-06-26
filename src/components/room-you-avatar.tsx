"use client";

import { useOptionalAccountAvatar } from "./account-avatar-provider";
import { UserAccountAvatar, type UserAccountAvatarSize } from "./user-account-avatar";
import { useAppAuth } from "@/hooks/use-app-auth";

type RoomYouAvatarProps = {
  size?: Extract<UserAccountAvatarSize, "room" | "room-mini">;
  className?: string;
};

export function RoomYouAvatar({
  size = "room",
  className = "",
}: RoomYouAvatarProps) {
  const accountAvatarContext = useOptionalAccountAvatar();
  const { displayLabel } = useAppAuth();
  const avatar = accountAvatarContext?.avatar;
  const label = avatar?.label ?? displayLabel ?? "You";

  return (
    <UserAccountAvatar
      label={label}
      avatarColor={avatar?.avatarColor ?? null}
      avatarPublicUrl={avatar?.avatarPublicUrl ?? null}
      avatarUpdatedAt={avatar?.avatarUpdatedAt ?? null}
      size={size}
      className={className}
    />
  );
}
