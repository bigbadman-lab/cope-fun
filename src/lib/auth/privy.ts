import "server-only";
import { PrivyClient, type User } from "@privy-io/server-auth";
import {
  extractSolanaRewardsWallet,
  isLikelySolanaAddress,
  type RewardsWalletSource,
} from "./rewards-wallet";

let privyClient: PrivyClient | null = null;

function getPrivyClient(): PrivyClient {
  if (privyClient) return privyClient;

  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;
  const appSecret = process.env.PRIVY_APP_SECRET;

  if (!appId || !appSecret) {
    throw new Error("Privy server environment is not configured.");
  }

  privyClient = new PrivyClient(appId, appSecret);
  return privyClient;
}

export function isPrivyConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_PRIVY_APP_ID && process.env.PRIVY_APP_SECRET,
  );
}

export type VerifiedPrivyAuth = {
  privyUserId: string;
};

export function extractPrivyProfile(user: User): {
  walletAddress: string | null;
  rewardsWalletSource: RewardsWalletSource | null;
  email: string | null;
  displayName: string | null;
} {
  const rewardsWallet = extractSolanaRewardsWallet(user);
  let email = user.email?.address ?? null;

  for (const account of user.linkedAccounts ?? []) {
    if (account.type === "email" && "address" in account && typeof account.address === "string") {
      if (!email) email = account.address;
    }
  }

  return {
    walletAddress: rewardsWallet.address,
    rewardsWalletSource: rewardsWallet.source,
    email,
    displayName: null,
  };
}

export function isStoredRewardsWalletAddress(
  address: string | null | undefined,
): address is string {
  return typeof address === "string" && isLikelySolanaAddress(address);
}

export async function verifyPrivyRequest(
  request: Request,
): Promise<VerifiedPrivyAuth | null> {
  if (!isPrivyConfigured()) return null;

  const header = request.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) return null;

  const token = header.slice("Bearer ".length).trim();
  if (!token) return null;

  try {
    const claims = await getPrivyClient().verifyAuthToken(token);
    return { privyUserId: claims.userId };
  } catch {
    return null;
  }
}

export async function fetchPrivyUser(privyUserId: string): Promise<User> {
  return getPrivyClient().getUser(privyUserId);
}

export function getBearerToken(request: Request): string | null {
  const header = request.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) return null;
  const token = header.slice("Bearer ".length).trim();
  return token || null;
}
