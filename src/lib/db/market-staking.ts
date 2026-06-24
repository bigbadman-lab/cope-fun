import "server-only";
import { createSupabaseServiceClient } from "@/lib/supabase/server";
import {
  ALLOWED_STAKE_AMOUNTS,
  type MarketSide,
  type StakeAmount,
} from "@/lib/markets/types";
import { getOrCreateCreditAccountForUser } from "./credits";

export function isAllowedStakeAmount(value: number): value is StakeAmount {
  return (ALLOWED_STAKE_AMOUNTS as readonly number[]).includes(value);
}

type StakeRpcResult = {
  position_id: string;
  balance_credits: number;
};

export async function stakeOnMarketForUser(input: {
  marketId: string;
  userId: string;
  side: MarketSide;
  stakeCredits: StakeAmount;
}) {
  if (!isAllowedStakeAmount(input.stakeCredits)) {
    throw new Error("Invalid stake amount.");
  }

  await getOrCreateCreditAccountForUser(input.userId);
  const supabase = createSupabaseServiceClient();

  const { data, error } = await supabase.rpc("stake_on_market_for_user", {
    p_market_id: input.marketId,
    p_user_id: input.userId,
    p_side: input.side,
    p_stake_credits: input.stakeCredits,
  });

  if (error) {
    throw new Error(error.message || "Could not place stake.");
  }

  const result = data as StakeRpcResult;

  return {
    side: input.side,
    stakeCredits: input.stakeCredits,
    balanceCredits: result.balance_credits,
  };
}
