/**
 * Official $SWARM token on Robinhood Chain mainnet.
 * Explorer URL format from Robinhood Chain docs:
 * https://docs.robinhood.com/chain/deploy-smart-contracts/
 */
export const SWARM_TOKEN_CONTRACT_ADDRESS =
  "0xe20cf2f31056539fcfa72f45c5eb63bdbb3806d8" as const;

export const ROBINHOOD_CHAIN_EXPLORER_BASE_URL =
  "https://robinhoodchain.blockscout.com" as const;

export const SWARM_TOKEN_EXPLORER_URL =
  `${ROBINHOOD_CHAIN_EXPLORER_BASE_URL}/address/${SWARM_TOKEN_CONTRACT_ADDRESS}` as const;
