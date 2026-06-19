export type AvatarPresetId =
  | "ember"
  | "signal"
  | "void"
  | "orange"
  | "ghost"
  | "static";

export type AvatarPreset = {
  id: AvatarPresetId;
  label: string;
  gradient: string;
  accentA: string;
  accentB?: string;
};

/** Preset avatars — maps to `users.avatar_preset_id` when backed by DB. */
export const AVATAR_PRESETS: AvatarPreset[] = [
  {
    id: "ember",
    label: "Ember",
    gradient: "from-orange-600 via-red-700 to-zinc-950",
    accentA: "bottom-[20%] left-[22%] size-[30%] rounded-full bg-orange-400/30",
    accentB: "right-[18%] top-[24%] size-[24%] rounded-sm bg-red-300/20",
  },
  {
    id: "signal",
    label: "Signal",
    gradient: "from-emerald-500 via-teal-600 to-zinc-950",
    accentA: "bottom-[24%] right-[20%] size-[28%] rounded-full bg-emerald-300/25",
    accentB: "left-[20%] top-[28%] size-[20%] rounded-sm bg-teal-200/15",
  },
  {
    id: "void",
    label: "Void",
    gradient: "from-zinc-700 via-zinc-900 to-black",
    accentA: "inset-[22%] rounded-md bg-gradient-to-tr from-zinc-500/20 to-transparent",
    accentB: "bottom-[18%] left-[30%] size-[18%] rounded-full bg-white/10",
  },
  {
    id: "orange",
    label: "Orange",
    gradient: "from-amber-500 via-orange-600 to-zinc-900",
    accentA: "inset-[18%] rounded-md bg-gradient-to-tr from-amber-300/25 to-orange-900/10",
    accentB: "right-[22%] top-[30%] size-[20%] rounded-full bg-amber-200/20",
  },
  {
    id: "ghost",
    label: "Ghost",
    gradient: "from-zinc-500 via-zinc-700 to-zinc-950",
    accentA: "inset-[24%] rounded-full bg-white/10",
    accentB: "bottom-[20%] left-[28%] size-[16%] rounded-sm bg-zinc-300/15",
  },
  {
    id: "static",
    label: "Static",
    gradient: "from-sky-500 via-indigo-700 to-zinc-950",
    accentA: "left-[18%] top-[22%] size-[22%] rounded-sm bg-sky-300/25",
    accentB: "bottom-[22%] right-[24%] size-[26%] rounded-full bg-indigo-300/15",
  },
];

export function getAvatarPreset(id: string): AvatarPreset | undefined {
  return AVATAR_PRESETS.find((preset) => preset.id === id);
}

export function isAvatarPresetId(id: string): id is AvatarPresetId {
  return AVATAR_PRESETS.some((preset) => preset.id === id);
}
