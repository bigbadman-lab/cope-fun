export const AVATAR_PRESET_COLORS = [
  {
    id: "orange",
    label: "Orange",
    background: "#d9773f",
    foreground: "#ffffff",
  },
  {
    id: "ember",
    label: "Ember",
    background: "#c45c2a",
    foreground: "#ffffff",
  },
  {
    id: "violet",
    label: "Violet",
    background: "#7c6bb8",
    foreground: "#ffffff",
  },
  {
    id: "blue",
    label: "Blue",
    background: "#4a7fd4",
    foreground: "#ffffff",
  },
  {
    id: "green",
    label: "Green",
    background: "#3d9b78",
    foreground: "#ffffff",
  },
  {
    id: "graphite",
    label: "Graphite",
    background: "#52525b",
    foreground: "#f4f4f5",
  },
] as const;

export type AvatarPresetColorId = (typeof AVATAR_PRESET_COLORS)[number]["id"];

export const AVATAR_PRESET_COLOR_IDS: AvatarPresetColorId[] =
  AVATAR_PRESET_COLORS.map((color) => color.id);

export const DEFAULT_AVATAR_COLOR: AvatarPresetColorId = "orange";

export function isValidAvatarColor(
  value: string,
): value is AvatarPresetColorId {
  return (AVATAR_PRESET_COLOR_IDS as readonly string[]).includes(value);
}

export function getAvatarPresetColor(id: string | null | undefined) {
  if (!id) return null;
  return AVATAR_PRESET_COLORS.find((color) => color.id === id) ?? null;
}

export function getAvatarPublicUrl(
  avatarPath: string | null | undefined,
): string | null {
  if (!avatarPath) return null;
  if (avatarPath.startsWith("http://") || avatarPath.startsWith("https://")) {
    return avatarPath;
  }

  const base = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  if (!base) return null;

  return `${base}/storage/v1/object/public/user-avatars/${avatarPath}`;
}
