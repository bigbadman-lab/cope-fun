export function formatWalletAddress(address: string): string {
  if (address.length <= 12) return address;
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

export function formatAppUserLabel(input: {
  id: string;
  displayName: string | null;
  walletAddress: string | null;
  email: string | null;
}): string {
  if (input.displayName?.trim()) {
    return input.displayName.trim();
  }

  if (input.walletAddress) {
    return formatWalletAddress(input.walletAddress);
  }

  if (input.email) {
    const [local, domain] = input.email.split("@");
    if (!domain) return input.email;
    if (local.length <= 2) return `${local[0] ?? ""}*@${domain}`;
    return `${local.slice(0, 3)}…@${domain}`;
  }

  return `User ${input.id.slice(0, 8)}`;
}
