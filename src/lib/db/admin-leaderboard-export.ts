import "server-only";
import { formatAppUserLabel } from "@/lib/auth/display-label";
import {
  extractPrivyProfile,
  fetchPrivyUser,
  isPrivyConfigured,
} from "@/lib/auth/privy";
import { isLikelyEvmAddress } from "@/lib/auth/rewards-wallet";
import type { RewardsWalletSource } from "@/lib/auth/rewards-wallet";
import { LEADERBOARD_MIN_MARKETS_ENTERED } from "@/lib/leaderboard/eligibility";
import { LEADERBOARD_RANK_ORDER } from "@/lib/leaderboard/ranking";
import {
  getSeasonExportId,
  resolveSeasonForExport,
  type Season,
} from "@/lib/seasons";
import { createSupabaseServiceClient } from "@/lib/supabase/server";

export const LEADERBOARD_EXPORT_CSV_HEADERS = [
  "season_id",
  "export_generated_at",
  "rank",
  "user_id",
  "privy_user_id",
  "display_label",
  "email",
  "wallet_address",
  "rewards_wallet_source",
  "wallet_missing",
  "eligible",
  "season_points",
  "markets_entered",
  "markets_won",
  "markets_lost",
  "total_won_credits",
  "balance_credits",
  "last_seen_at",
  "created_at",
] as const;

export type LeaderboardExportRow = {
  seasonId: string;
  exportGeneratedAt: string;
  rank: number;
  userId: string;
  privyUserId: string;
  displayLabel: string;
  email: string | null;
  walletAddress: string | null;
  rewardsWalletSource: RewardsWalletSource | "unknown" | null;
  walletMissing: boolean;
  eligible: boolean;
  seasonPoints: number;
  marketsEntered: number;
  marketsWon: number;
  marketsLost: number;
  totalWonCredits: number;
  balanceCredits: number;
  lastSeenAt: string | null;
  createdAt: string;
};

type ExportQueryRow = {
  user_id: string;
  balance_credits: number;
  season_points: number;
  total_won_credits: number;
  markets_entered: number;
  markets_won: number;
  markets_lost: number;
  updated_at: string;
  created_at: string;
  app_users: {
    id: string;
    privy_user_id: string;
    display_name: string | null;
    wallet_address: string | null;
    email: string | null;
    last_seen_at: string | null;
    created_at: string;
  } | Array<{
    id: string;
    privy_user_id: string;
    display_name: string | null;
    wallet_address: string | null;
    email: string | null;
    last_seen_at: string | null;
    created_at: string;
  }>;
};

function normalizeSeasonPoints(value: number | null | undefined): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    return 0;
  }
  return Math.trunc(value);
}

function hasRewardsWalletAddress(
  walletAddress: string | null | undefined,
): walletAddress is string {
  return typeof walletAddress === "string" && isLikelyEvmAddress(walletAddress);
}

async function resolveRewardsWalletSource(
  privyUserId: string,
): Promise<RewardsWalletSource | "unknown" | null> {
  if (!isPrivyConfigured()) return "unknown";

  try {
    const privyUser = await fetchPrivyUser(privyUserId);
    return extractPrivyProfile(privyUser).rewardsWalletSource ?? "unknown";
  } catch {
    return "unknown";
  }
}

async function loadLeaderboardExportQueryRows(): Promise<ExportQueryRow[]> {
  const supabase = createSupabaseServiceClient();

  let query = supabase
    .from("cope_credit_accounts")
    .select(
      `
      user_id,
      balance_credits,
      season_points,
      total_won_credits,
      markets_entered,
      markets_won,
      markets_lost,
      updated_at,
      created_at,
      app_users!inner (
        id,
        privy_user_id,
        display_name,
        wallet_address,
        email,
        last_seen_at,
        created_at
      )
    `,
    )
    .not("user_id", "is", null)
    .gte("markets_entered", LEADERBOARD_MIN_MARKETS_ENTERED);

  for (const { column, ascending } of LEADERBOARD_RANK_ORDER) {
    query = query.order(column, { ascending });
  }

  const { data, error } = await query;

  if (error || !data) {
    throw new Error("Could not load leaderboard export rows.");
  }

  return data as ExportQueryRow[];
}

export async function countLeaderboardExportMissingWallets(): Promise<number> {
  const rows = await loadLeaderboardExportQueryRows();

  return rows.reduce((count, row) => {
    const userRaw = row.app_users;
    const user = Array.isArray(userRaw) ? userRaw[0] : userRaw;
    return hasRewardsWalletAddress(user.wallet_address) ? count : count + 1;
  }, 0);
}

export async function getLeaderboardExportRows(input?: {
  seasonId?: string | null;
  exportGeneratedAt?: string;
}): Promise<{
  season: Season;
  rows: LeaderboardExportRow[];
}> {
  const season = resolveSeasonForExport(input?.seasonId);
  const seasonSlug = getSeasonExportId(season);
  const exportGeneratedAt = input?.exportGeneratedAt ?? new Date().toISOString();
  const queryRows = await loadLeaderboardExportQueryRows();

  const privySourceByUserId = new Map<string, RewardsWalletSource | "unknown">();

  if (isPrivyConfigured()) {
    const privyUserIds = queryRows.map((row) => {
      const userRaw = row.app_users;
      const user = Array.isArray(userRaw) ? userRaw[0] : userRaw;
      return user.privy_user_id;
    });

    await Promise.all(
      privyUserIds.map(async (privyUserId) => {
        const source = await resolveRewardsWalletSource(privyUserId);
        if (source) {
          privySourceByUserId.set(privyUserId, source);
        }
      }),
    );
  }

  const rows = queryRows.map((row, index) => {
    const userRaw = row.app_users;
    const user = Array.isArray(userRaw) ? userRaw[0] : userRaw;
    const walletAddress = hasRewardsWalletAddress(user.wallet_address)
      ? user.wallet_address
      : null;
    const walletMissing = !walletAddress;
    const marketsEntered = row.markets_entered;
    const eligible = marketsEntered >= LEADERBOARD_MIN_MARKETS_ENTERED && !walletMissing;
    const rewardsWalletSource =
      privySourceByUserId.get(user.privy_user_id) ??
      (walletAddress ? "unknown" : null);

    return {
      seasonId: seasonSlug,
      exportGeneratedAt,
      rank: index + 1,
      userId: user.id,
      privyUserId: user.privy_user_id,
      displayLabel: formatAppUserLabel({
        id: user.id,
        displayName: user.display_name,
        walletAddress: user.wallet_address,
        email: user.email,
      }),
      email: user.email,
      walletAddress,
      rewardsWalletSource,
      walletMissing,
      eligible,
      seasonPoints: normalizeSeasonPoints(row.season_points),
      marketsEntered,
      marketsWon: row.markets_won,
      marketsLost: row.markets_lost,
      totalWonCredits: row.total_won_credits,
      balanceCredits: row.balance_credits,
      lastSeenAt: user.last_seen_at,
      createdAt: user.created_at,
    };
  });

  return { season, rows };
}

export function leaderboardExportRowToCsvCells(
  row: LeaderboardExportRow,
): (string | number | boolean)[] {
  return [
    row.seasonId,
    row.exportGeneratedAt,
    row.rank,
    row.userId,
    row.privyUserId,
    row.displayLabel,
    row.email ?? "",
    row.walletAddress ?? "",
    row.rewardsWalletSource ?? "",
    row.walletMissing,
    row.eligible,
    row.seasonPoints,
    row.marketsEntered,
    row.marketsWon,
    row.marketsLost,
    row.totalWonCredits,
    row.balanceCredits,
    row.lastSeenAt ?? "",
    row.createdAt,
  ];
}
