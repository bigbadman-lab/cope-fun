"use client";

import { PrivyProvider, type PrivyClientConfig, type WalletListEntry } from "@privy-io/react-auth";
import { AccountAvatarProvider } from "./account-avatar-provider";
import { AuthSync } from "./auth-sync";

// Privy only renders wallets listed here (order = modal order).
// `wallet_connect` covers mobile/other EVM wallets via WalletConnect.
const ALLOWED_EXTERNAL_WALLETS: WalletListEntry[] = [
  "metamask",
  "coinbase_wallet",
  "rainbow",
  "wallet_connect",
];

// Stable reference — recreating this object each render can remount Privy's modal.
const PRIVY_CONFIG: PrivyClientConfig = {
  loginMethods: ["wallet", "email"],
  appearance: {
    theme: "dark",
    accentColor: "#CCFE02",
    // Square mark — wide wordmarks can render poorly in the Privy modal header.
    logo: "/hoodhome.png",
    walletChainType: "ethereum-only",
    walletList: ALLOWED_EXTERNAL_WALLETS,
  },
  embeddedWallets: {
    ethereum: {
      createOnLogin: "users-without-wallets",
    },
    solana: {
      createOnLogin: "off",
    },
  },
};

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
    <PrivyProvider appId={appId} config={PRIVY_CONFIG}>
      <AuthSync />
      <AccountAvatarProvider>{children}</AccountAvatarProvider>
    </PrivyProvider>
  );
}
