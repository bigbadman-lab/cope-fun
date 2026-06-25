"use client";

import { PrivyProvider } from "@privy-io/react-auth";
import { AccountAvatarProvider } from "./account-avatar-provider";
import { AuthSync } from "./auth-sync";

type AppPrivyProviderProps = {
  children: React.ReactNode;
};

export function AppPrivyProvider({ children }: AppPrivyProviderProps) {
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;

  if (!appId) {
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
        },
        embeddedWallets: {
          ethereum: {
            createOnLogin: "off",
          },
        },
      }}
    >
      <AuthSync />
      <AccountAvatarProvider>{children}</AccountAvatarProvider>
    </PrivyProvider>
  );
}
