/**
 * Solana rewards wallet selection for Privy users.
 * Shared by client hooks and server auth sync — keep free of server-only imports.
 */

export type RewardsWalletSource = "connected" | "embedded" | "unknown";

export type RewardsWalletInfo = {
  address: string | null;
  source: RewardsWalletSource | null;
};

type WalletLikeAccount = {
  type?: string;
  address?: string;
  chainType?: string;
  chain_type?: string;
  walletClientType?: string;
  wallet_client_type?: string;
  connectorType?: string;
  connector_type?: string;
};

type PrivyUserLike = {
  wallet?: WalletLikeAccount | null;
  linkedAccounts?: WalletLikeAccount[] | null;
};

const BASE58_RE = /^[1-9A-HJ-NP-Za-km-z]+$/;

const EMBEDDED_WALLET_CLIENT_TYPES = new Set(["privy", "privy-v2"]);

/** Base58 Solana address heuristic — Privy should set chainType, but we guard anyway. */
export function isLikelySolanaAddress(address: string): boolean {
  const trimmed = address.trim();
  if (!trimmed || trimmed.startsWith("0x")) return false;
  if (trimmed.length < 32 || trimmed.length > 44) return false;
  return BASE58_RE.test(trimmed);
}

function readChainType(account: WalletLikeAccount): string | null {
  const value = account.chainType ?? account.chain_type;
  return typeof value === "string" ? value.toLowerCase() : null;
}

function readWalletClientType(account: WalletLikeAccount): string | null {
  const value = account.walletClientType ?? account.wallet_client_type;
  return typeof value === "string" ? value.toLowerCase() : null;
}

function readConnectorType(account: WalletLikeAccount): string | null {
  const value = account.connectorType ?? account.connector_type;
  return typeof value === "string" ? value.toLowerCase() : null;
}

export function isEmbeddedPrivyWallet(account: WalletLikeAccount): boolean {
  const clientType = readWalletClientType(account);
  if (clientType && EMBEDDED_WALLET_CLIENT_TYPES.has(clientType)) return true;
  return readConnectorType(account) === "embedded";
}

function isSolanaWalletAccount(account: WalletLikeAccount): boolean {
  if (typeof account.address !== "string" || !account.address.trim()) {
    return false;
  }

  const chainType = readChainType(account);
  if (chainType === "solana") return true;
  if (chainType === "ethereum") return false;

  // Fallback when Privy omits chain metadata on older linked accounts.
  return isLikelySolanaAddress(account.address);
}

function collectWalletAccounts(user: PrivyUserLike): WalletLikeAccount[] {
  const accounts: WalletLikeAccount[] = [];

  if (user.wallet && typeof user.wallet.address === "string") {
    accounts.push(user.wallet);
  }

  for (const account of user.linkedAccounts ?? []) {
    if (account.type === "wallet" && typeof account.address === "string") {
      accounts.push(account);
    }
  }

  return accounts;
}

function pickRewardsWallet(
  accounts: WalletLikeAccount[],
  preferEmbedded: boolean,
): RewardsWalletInfo {
  const solanaWallets = accounts.filter(isSolanaWalletAccount);
  if (solanaWallets.length === 0) {
    return { address: null, source: null };
  }

  const external = solanaWallets.filter((account) => !isEmbeddedPrivyWallet(account));
  const embedded = solanaWallets.filter((account) => isEmbeddedPrivyWallet(account));

  const primaryPool = preferEmbedded
    ? [...embedded, ...external]
    : [...external, ...embedded];

  const selected = primaryPool[0];
  if (!selected?.address) {
    return { address: null, source: null };
  }

  if (isEmbeddedPrivyWallet(selected)) {
    return { address: selected.address, source: "embedded" };
  }

  if (external.length > 0) {
    return { address: selected.address, source: "connected" };
  }

  return { address: selected.address, source: "unknown" };
}

/**
 * Select the user's Solana rewards wallet.
 * Priority: external Solana wallet, then Privy embedded Solana wallet.
 */
export function extractSolanaRewardsWallet(user: PrivyUserLike): RewardsWalletInfo {
  const accounts = collectWalletAccounts(user);
  return pickRewardsWallet(accounts, false);
}

export function rewardsWalletSourceLabel(
  source: RewardsWalletSource | null | undefined,
): string {
  switch (source) {
    case "connected":
      return "Connected wallet";
    case "embedded":
      return "Cope wallet";
    default:
      return "Unknown";
  }
}
