const AVATAR_COLORS: Record<string, string> = {
  You: "from-violet-500 to-violet-700",
  "Cope Engine": "from-emerald-500 to-teal-700",
  Mason: "from-orange-500 to-red-600",
  Victor: "from-sky-500 to-blue-700",
  Logan: "from-amber-400 to-orange-600",
  Theo: "from-pink-500 to-rose-700",
};

type AvatarPlaceholderProps = {
  name: string;
};

export function AvatarPlaceholder({ name }: AvatarPlaceholderProps) {
  const gradient = AVATAR_COLORS[name] ?? "from-zinc-500 to-zinc-700";
  const initial = name === "You" ? "Y" : name.charAt(0);

  return (
    <div
      className={`flex size-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br text-xs font-semibold text-white ${gradient}`}
      aria-hidden
    >
      {initial}
    </div>
  );
}
