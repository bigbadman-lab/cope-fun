/**
 * EVM rewards wallet selection for Privy users.
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

const EVM_ADDRESS_RE = /^0x[0-9a-fA-F]{40}$/;

const EMBEDDED_WALLET_CLIENT_TYPES = new Set(["privy", "privy-v2"]);

/** 20-byte 0x-prefixed EVM address check — Privy should set chainType, but we guard anyway. */
export function isLikelyEvmAddress(address: string): boolean {
  return EVM_ADDRESS_RE.test(address.trim());
}

/**
 * Canonical persisted form: trimmed and lowercased.
 * EVM addresses are case-insensitive for identity; lowercasing keeps
 * database comparisons consistent. Returns null for invalid addresses.
 */
export function normalizeEvmAddress(address: string | null | undefined): string | null {
  if (typeof address !== "string") return null;
  const trimmed = address.trim();
  if (!EVM_ADDRESS_RE.test(trimmed)) return null;
  return trimmed.toLowerCase();
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

function isEvmWalletAccount(account: WalletLikeAccount): boolean {
  if (typeof account.address !== "string" || !account.address.trim()) {
    return false;
  }

  const chainType = readChainType(account);
  if (chainType === "ethereum") return true;
  if (chainType === "solana") return false;

  // Fallback when Privy omits chain metadata on older linked accounts.
  return isLikelyEvmAddress(account.address);
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
  const evmWallets = accounts.filter(isEvmWalletAccount);
  if (evmWallets.length === 0) {
    return { address: null, source: null };
  }

  const external = evmWallets.filter((account) => !isEmbeddedPrivyWallet(account));
  const embedded = evmWallets.filter((account) => isEmbeddedPrivyWallet(account));

  const primaryPool = preferEmbedded
    ? [...embedded, ...external]
    : [...external, ...embedded];

  const selected = primaryPool[0];
  const normalized = normalizeEvmAddress(selected?.address);
  if (!selected || !normalized) {
    return { address: null, source: null };
  }

  if (isEmbeddedPrivyWallet(selected)) {
    return { address: normalized, source: "embedded" };
  }

  if (external.length > 0) {
    return { address: normalized, source: "connected" };
  }

  return { address: normalized, source: "unknown" };
}

/**
 * Select the user's EVM rewards wallet.
 * Priority: external (connected) EVM wallet, then Privy embedded EVM wallet.
 * The returned address is normalized (trimmed, lowercased).
 */
export function extractEvmRewardsWallet(user: PrivyUserLike): RewardsWalletInfo {
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
      return "Hoodswarm wallet";
    default:
      return "Unknown";
  }
}
