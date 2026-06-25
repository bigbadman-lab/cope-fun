export function getAccountInitials(label: string): string {
  const trimmed = label.trim();
  if (!trimmed) return "?";

  if (trimmed.startsWith("0x") || trimmed.includes("…")) {
    return trimmed.slice(0, 2).toUpperCase();
  }

  if (trimmed.includes("@")) {
    return trimmed.slice(0, 2).toUpperCase();
  }

  const parts = trimmed.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]?.[0] ?? ""}${parts[1]?.[0] ?? ""}`.toUpperCase();
  }

  return trimmed.slice(0, 2).toUpperCase();
}
