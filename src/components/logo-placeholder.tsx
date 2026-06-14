type LogoPlaceholderProps = {
  size?: "sm" | "md" | "lg";
  className?: string;
};

const sizes = {
  sm: "size-7 rounded-lg",
  md: "size-12 rounded-xl",
  lg: "size-16 rounded-2xl",
};

export function LogoPlaceholder({
  size = "sm",
  className = "",
}: LogoPlaceholderProps) {
  return (
    <div
      className={`shrink-0 bg-gradient-to-br from-zinc-600 to-zinc-800 ${sizes[size]} ${className}`}
      aria-hidden
    />
  );
}
