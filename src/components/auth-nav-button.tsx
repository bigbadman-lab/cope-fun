"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAppAuth } from "@/hooks/use-app-auth";
import { useAccountAvatar } from "./account-avatar-provider";
import { SubmitButtonLoader } from "./belief-input";
import { UserAccountAvatar } from "./user-account-avatar";
import { navIconActiveClass, navIconButtonClass } from "./theme-toggle";

type AuthNavAffordanceProps = {
  variant?: "nav" | "menu";
  onNavigate?: () => void;
};

function AuthConnectingState({
  variant,
}: {
  variant: "nav" | "menu";
}) {
  const isMenu = variant === "menu";

  return (
    <span
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label="Connecting account"
      className={
        isMenu
          ? "flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-zinc-200/70 bg-surface/40 px-4 text-sm text-zinc-500 dark:border-white/[0.07] dark:bg-surface/30"
          : `${navIconButtonClass} pointer-events-none gap-2 px-2.5 sm:min-w-[6.5rem] sm:justify-start`
      }
    >
      <SubmitButtonLoader />
      <span className={isMenu ? "font-medium" : "hidden text-xs font-medium sm:inline"}>
        Connecting
      </span>
    </span>
  );
}

function AuthSignInButton({
  variant,
  onSignIn,
}: {
  variant: "nav" | "menu";
  onSignIn: () => void;
}) {
  const isMenu = variant === "menu";

  return (
    <button
      type="button"
      onClick={onSignIn}
      aria-label="Sign in"
      className={
        isMenu
          ? "inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-cope-orange/25 bg-cope-orange/10 px-4 text-sm font-medium text-cope-orange transition-[color,background-color,transform,border-color] duration-200 ease-out hover:border-cope-orange/40 hover:bg-cope-orange/15 active:scale-[0.99]"
          : "inline-flex h-9 max-w-full items-center justify-center gap-1.5 rounded-lg border border-zinc-200/70 bg-background/60 px-2.5 text-xs font-medium text-zinc-700 transition-[color,background-color,transform,border-color,box-shadow] duration-200 ease-out hover:border-cope-orange/30 hover:bg-cope-orange/10 hover:text-cope-orange focus:outline-none focus-visible:ring-2 focus-visible:ring-cope-orange/25 active:scale-[0.98] dark:border-white/[0.08] dark:bg-background/40 dark:text-zinc-200 dark:hover:border-cope-orange/30 dark:hover:bg-cope-orange/10 dark:hover:text-cope-orange dark:focus-visible:ring-cope-orange/20 sm:px-3"
      }
    >
      Sign in
    </button>
  );
}

function AuthAccountChip({
  variant,
  label,
  avatarColor,
  avatarPublicUrl,
  avatarUpdatedAt,
  profileActive,
  onNavigate,
}: {
  variant: "nav" | "menu";
  label: string;
  avatarColor: string | null;
  avatarPublicUrl: string | null;
  avatarUpdatedAt: string | null;
  profileActive: boolean;
  onNavigate?: () => void;
}) {
  const isMenu = variant === "menu";

  const sharedClassName = [
    "group relative inline-flex items-center gap-2 transition-[color,background-color,transform,border-color,box-shadow] duration-200 ease-out",
    profileActive
      ? "border-cope-orange/35 bg-cope-orange/10 text-cope-orange dark:border-cope-orange/30 dark:bg-cope-orange/10 dark:text-cope-orange"
      : "border-zinc-200/70 bg-background/60 text-zinc-800 hover:border-cope-orange/25 hover:bg-cope-orange/[0.07] hover:text-zinc-900 dark:border-white/[0.08] dark:bg-background/40 dark:text-zinc-100 dark:hover:border-cope-orange/25 dark:hover:bg-cope-orange/10 dark:hover:text-zinc-50",
    isMenu
      ? "min-h-11 w-full rounded-xl border px-3 py-2 active:scale-[0.99]"
      : "h-9 max-w-[9.5rem] rounded-lg border px-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-cope-orange/25 active:scale-[0.98] dark:focus-visible:ring-cope-orange/20 sm:max-w-[10.5rem] sm:px-2.5",
    profileActive && !isMenu ? navIconActiveClass : "",
  ].join(" ");

  return (
    <Link
      href="/profile"
      onClick={onNavigate}
      aria-current={profileActive ? "page" : undefined}
      aria-label={`Account: ${label}. Open profile dashboard.`}
      className={sharedClassName}
    >
      <UserAccountAvatar
        label={label}
        avatarColor={avatarColor}
        avatarPublicUrl={avatarPublicUrl}
        avatarUpdatedAt={avatarUpdatedAt}
        size={isMenu ? "sm" : "xs"}
        showStatusDot
      />
      <span className={`min-w-0 truncate font-medium ${isMenu ? "text-sm" : "hidden text-xs sm:inline"}`}>
        {label}
      </span>
      {isMenu && (
        <span className="ml-auto text-xs text-zinc-500 transition-colors group-hover:text-cope-orange dark:text-zinc-500">
          Dashboard
        </span>
      )}
    </Link>
  );
}

export function AuthNavAffordance({
  variant = "nav",
  onNavigate,
}: AuthNavAffordanceProps) {
  const pathname = usePathname();
  const { ready, authenticated, displayLabel, login } = useAppAuth();
  const { avatar } = useAccountAvatar();
  const profileActive = pathname === "/profile";

  if (!ready) {
    return <AuthConnectingState variant={variant} />;
  }

  if (authenticated) {
    const label = avatar?.label ?? displayLabel ?? "Account";

    return (
      <AuthAccountChip
        variant={variant}
        label={label}
        avatarColor={avatar?.avatarColor ?? null}
        avatarPublicUrl={avatar?.avatarPublicUrl ?? null}
        avatarUpdatedAt={avatar?.avatarUpdatedAt ?? null}
        profileActive={profileActive}
        onNavigate={onNavigate}
      />
    );
  }

  return (
    <AuthSignInButton
      variant={variant}
      onSignIn={() => login()}
    />
  );
}

export function AuthNavButton() {
  return <AuthNavAffordance variant="nav" />;
}
