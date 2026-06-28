"use client";

import { PrivyProvider } from "@privy-io/react-auth";
import { AccountAvatarProvider } from "./account-avatar-provider";
import { AuthSync } from "./auth-sync";

type AppPrivyProviderProps = {
  children: React.ReactNode;
};

function PrivyConfigError({ message }: { message: string }) {
  return (
    <div className="flex min-h-app flex-1 items-center justify-center px-6 py-16">
      <div className="max-w-md rounded-xl border border-rose-200/70 bg-rose-50/40 px-5 py-6 text-center dark:border-rose-900/30 dark:bg-rose-950/20">
        <p className="text-sm font-medium text-rose-900 dark:text-rose-200">
          Authentication unavailable
        </p>
        <p className="mt-2 text-sm leading-relaxed text-rose-800/90 dark:text-rose-300/90">
          {message}
        </p>
      </div>
    </div>
  );
}

export function AppPrivyProvider({ children }: AppPrivyProviderProps) {
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;
  const isProduction = process.env.NODE_ENV === "production";

  if (!appId) {
    if (isProduction) {
      return (
        <PrivyConfigError message="NEXT_PUBLIC_PRIVY_APP_ID is not configured for this deployment. Sign-in is disabled until this is fixed." />
      );
    }

    return children;
  }

  return (
    <PrivyProvider
      appId={appId}
      config={{
        loginMethods: ["wallet", "email"],
        appearance: {
          theme: "#0a0a0a",
          accentColor: "#f97316",
          logo: "/logotext3.png",
          walletChainType: "solana-only",
        },
        embeddedWallets: {
          ethereum: {
            createOnLogin: "off",
          },
          solana: {
            createOnLogin: "users-without-wallets",
          },
        },
      }}
    >
      <AuthSync />
      <AccountAvatarProvider>{children}</AccountAvatarProvider>
    </PrivyProvider>
  );
}
