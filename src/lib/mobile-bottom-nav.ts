export type MobileBottomNavItemId =
  | "beliefs"
  | "markets"
  | "create"
  | "leaderboard"
  | "profile";

export type MobileBottomNavItem = {
  id: MobileBottomNavItemId;
  href: string;
  label: string;
};

export const MOBILE_BOTTOM_NAV_ITEMS: MobileBottomNavItem[] = [
  { id: "beliefs", href: "/beliefs", label: "Beliefs" },
  { id: "markets", href: "/markets", label: "Markets" },
  { id: "create", href: "/", label: "Create" },
  { id: "leaderboard", href: "/leaderboard", label: "Leaderboard" },
  { id: "profile", href: "/profile", label: "Profile" },
];

export function getActiveMobileBottomNavItem(
  pathname: string,
): MobileBottomNavItemId | null {
  if (pathname === "/") return "create";
  if (pathname === "/beliefs" || pathname.startsWith("/room/")) return "beliefs";
  if (pathname === "/markets" || pathname.startsWith("/markets/")) {
    return "markets";
  }
  if (pathname === "/leaderboard" || pathname.startsWith("/leaderboard/")) {
    return "leaderboard";
  }
  if (pathname === "/profile" || pathname.startsWith("/profile/")) {
    return "profile";
  }

  return null;
}
