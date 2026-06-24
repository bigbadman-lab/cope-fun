import "server-only";
import { createSupabaseServiceClient } from "@/lib/supabase/server";
import { getOrCreateAnonymousSession } from "./anonymous-session";
import type { CreditAccountView } from "@/lib/markets/types";

const INITIAL_CREDIT_GRANT = 1000;

type CreditAccountRow = {
  id: string;
  anonymous_session_id: string;
  balance_credits: number;
  season_points: number;
  total_staked_credits: number;
  total_won_credits: number;
  total_lost_credits: number;
  markets_entered: number;
  markets_won: number;
  markets_lost: number;
};

function toCreditAccountView(row: CreditAccountRow): CreditAccountView {
  return {
    balanceCredits: row.balance_credits,
    seasonPoints: row.season_points,
    totalStakedCredits: row.total_staked_credits,
    totalWonCredits: row.total_won_credits,
    totalLostCredits: row.total_lost_credits,
    marketsEntered: row.markets_entered,
    marketsWon: row.markets_won,
    marketsLost: row.markets_lost,
  };
}

export async function getOrCreateCreditAccount(
  anonymousToken: string,
): Promise<CreditAccountView & { id: string; anonymousSessionId: string }> {
  const session = await getOrCreateAnonymousSession(anonymousToken);
  const supabase = createSupabaseServiceClient();

  const { data: existing, error: existingError } = await supabase
    .from("cope_credit_accounts")
    .select("*")
    .eq("anonymous_session_id", session.id)
    .maybeSingle();

  if (existingError) {
    throw new Error("Could not load credit account.");
  }

  if (existing) {
    return {
      id: existing.id,
      anonymousSessionId: session.id,
      ...toCreditAccountView(existing as CreditAccountRow),
    };
  }

  const { data: created, error: createError } = await supabase
    .from("cope_credit_accounts")
    .insert({ anonymous_session_id: session.id })
    .select("*")
    .single();

  if (createError) {
    if (createError.code === "23505") {
      const { data: raced, error: racedError } = await supabase
        .from("cope_credit_accounts")
        .select("*")
        .eq("anonymous_session_id", session.id)
        .single();

      if (racedError || !raced) {
        throw new Error("Could not create credit account.");
      }

      return {
        id: raced.id,
        anonymousSessionId: session.id,
        ...toCreditAccountView(raced as CreditAccountRow),
      };
    }

    throw new Error("Could not create credit account.");
  }

  if (!created) {
    throw new Error("Could not create credit account.");
  }

  const { error: ledgerError } = await supabase
    .from("cope_credit_ledger_entries")
    .insert({
      anonymous_session_id: session.id,
      delta_credits: INITIAL_CREDIT_GRANT,
      reason: "initial season credit grant",
    });

  if (ledgerError) {
    throw new Error("Could not record initial credit grant.");
  }

  return {
    id: created.id,
    anonymousSessionId: session.id,
    ...toCreditAccountView(created as CreditAccountRow),
  };
}

export async function insertLedgerEntry(input: {
  anonymousSessionId: string;
  marketId?: string | null;
  deltaCredits: number;
  reason: string;
}): Promise<void> {
  const supabase = createSupabaseServiceClient();
  const { error } = await supabase.from("cope_credit_ledger_entries").insert({
    anonymous_session_id: input.anonymousSessionId,
    market_id: input.marketId ?? null,
    delta_credits: input.deltaCredits,
    reason: input.reason,
  });

  if (error) {
    throw new Error("Could not record ledger entry.");
  }
}

export async function debitCreditAccount(input: {
  accountId: string;
  stakeCredits: number;
}): Promise<CreditAccountRow> {
  const supabase = createSupabaseServiceClient();
  const { data: account, error: loadError } = await supabase
    .from("cope_credit_accounts")
    .select("*")
    .eq("id", input.accountId)
    .single();

  if (loadError || !account) {
    throw new Error("Credit account not found.");
  }

  const row = account as CreditAccountRow;
  if (row.balance_credits < input.stakeCredits) {
    throw new Error("Insufficient credits.");
  }

  const { data: updated, error: updateError } = await supabase
    .from("cope_credit_accounts")
    .update({
      balance_credits: row.balance_credits - input.stakeCredits,
      total_staked_credits: row.total_staked_credits + input.stakeCredits,
      markets_entered: row.markets_entered + 1,
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.accountId)
    .eq("balance_credits", row.balance_credits)
    .select("*")
    .single();

  if (updateError || !updated) {
    throw new Error("Could not debit credit account.");
  }

  return updated as CreditAccountRow;
}

export async function creditAccountPayout(input: {
  accountId: string;
  payoutCredits: number;
  isWinner: boolean;
  stakeCredits: number;
}): Promise<void> {
  const supabase = createSupabaseServiceClient();
  const { data: account, error: loadError } = await supabase
    .from("cope_credit_accounts")
    .select("*")
    .eq("id", input.accountId)
    .single();

  if (loadError || !account) {
    throw new Error("Credit account not found.");
  }

  const row = account as CreditAccountRow;
  const updates: Record<string, number | string> = {
    updated_at: new Date().toISOString(),
  };

  if (input.isWinner) {
    updates.balance_credits = row.balance_credits + input.payoutCredits;
    updates.total_won_credits = row.total_won_credits + input.payoutCredits;
    updates.season_points = row.season_points + input.payoutCredits;
    updates.markets_won = row.markets_won + 1;
  } else {
    updates.total_lost_credits = row.total_lost_credits + input.stakeCredits;
    updates.markets_lost = row.markets_lost + 1;
  }

  const { error: updateError } = await supabase
    .from("cope_credit_accounts")
    .update(updates)
    .eq("id", input.accountId);

  if (updateError) {
    throw new Error("Could not update credit account.");
  }
}

export async function refundCreditAccount(input: {
  anonymousSessionId: string;
  refundCredits: number;
}): Promise<void> {
  const supabase = createSupabaseServiceClient();
  const { data: account, error: loadError } = await supabase
    .from("cope_credit_accounts")
    .select("*")
    .eq("anonymous_session_id", input.anonymousSessionId)
    .single();

  if (loadError || !account) {
    throw new Error("Credit account not found.");
  }

  const row = account as CreditAccountRow;
  const { error: updateError } = await supabase
    .from("cope_credit_accounts")
    .update({
      balance_credits: row.balance_credits + input.refundCredits,
      updated_at: new Date().toISOString(),
    })
    .eq("id", row.id);

  if (updateError) {
    throw new Error("Could not refund credit account.");
  }
}

export async function getCreditAccountIdForSession(
  anonymousSessionId: string,
): Promise<string | null> {
  const supabase = createSupabaseServiceClient();
  const { data, error } = await supabase
    .from("cope_credit_accounts")
    .select("id")
    .eq("anonymous_session_id", anonymousSessionId)
    .maybeSingle();

  if (error || !data) return null;
  return data.id;
}
