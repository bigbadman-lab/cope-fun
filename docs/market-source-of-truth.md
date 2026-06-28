# Market source of truth (MVP)

> **Canonical spec:** [market-spec-v1.md](./market-spec-v1.md) — product rules, lifecycle, credits, Treasury Conviction, Season 1 launch checklist, and non-goals.

This document is a short engineering pointer for developers working on market code.

## Summary

MVP markets are **Supabase/DB-backed only**. Legacy random, hash-based, and localStorage market generation has been removed (Release 0.9).

## Markets

- **Table:** `belief_room_markets` (one market per `belief_rooms` row)
- **Lifecycle:** Admin creates draft → publish → close → resolve/void
- **Types:** `src/lib/markets/types.ts`
- **Read/write:** `src/lib/db/markets.ts`, `market-admin.ts`, `market-staking.ts`, `market-settlement.ts`
- **UI:** `/markets`, room `RoomMarketPanel`, `/admin` markets section

Admin-created markets attach to published belief rooms flagged as market candidates.

## Treasury Conviction

- **Column:** `belief_room_markets.treasury_conviction_cope` (migration `202606253_phase_7_treasury_conviction.sql`)
- **TypeScript:** `treasuryConvictionCope` on `PublicMarket` / `AdminMarketRow`
- **Admin:** Create and edit via `/admin` — `POST /api/admin/markets/create`, `POST /api/admin/markets/[marketId]/update` (Release 0.96)
- **Public UI:** `/markets` list rows + room `RoomMarketPanel` when `> 0`
- **Display-only:** Does not affect COPE Credit balances, staking, settlement, pool odds, leaderboard, or payouts

## COPE Credits

- **User-scoped** via Privy → `app_users` → `cope_credit_accounts`
- Initial Season grant on first auth sync (`initial_season_grant`)
- Staking requires signed-in user (`POST /api/markets/[marketId]/stake`)

Anonymous-session credit staking RPC exists in migrations but is **not exposed** by API routes.

## Leaderboard (Season 1)

- **Score:** `cope_credit_accounts.season_points` (active season score for MVP Season 1)
- **Ranking:** `src/lib/db/leaderboard.ts` + shared order in `src/lib/leaderboard/ranking.ts`
- **Eligibility:** `markets_entered >= 1`
- **Settlement:** Winning resolves increment `season_points` via `resolve_market` RPC (no change required)
- **Limitation:** Single column on credit account — not multi-season history. Reset/snapshot required before Season 2.
- **Rewards:** Automatic $COPE payout not implemented; snapshot tables remain future work
- **Admin export:** `GET /api/admin/leaderboard/export?seasonId=season-1` (`src/lib/db/admin-leaderboard-export.ts`) — admin-only CSV for manual reward review. Same ranking rules as public leaderboard. Includes wallet addresses and `wallet_missing` / `eligible` flags. Does not send tokens or expose private keys.

## Season curation (Release 0.95 Phase 5)

- **Columns:** `season_id`, `display_order`, `is_featured` on `belief_room_markets` (migration `202606254_phase_7_season_curation.sql`)
- **Defaults:** New drafts get current season (`season-1` etc.), `display_order = null`, `is_featured = false`
- **Admin:** Edit season, order, featured, and all draft metadata via `/admin` → “Edit market” → `POST /api/admin/markets/[marketId]/update` (Release 0.96). Legacy curation-only route: `POST /api/admin/markets/[marketId]/curation`
- **Public `/markets` order:** Current season first → featured → `display_order ASC` → `created_at DESC`
- **Launch checklist:** Read-only report in admin (`src/lib/markets/season-curation.ts`) — includes future close time, published/open, and draft counts
- **Not done in this phase:** Seeding or publishing the 10 Season 1 markets. Operate launch from `/admin` without SQL.

## Admin market operations (Release 0.96)

- **Helper:** `updateMarketAdminFields()` in `src/lib/db/market-admin.ts`
- **API:** `POST /api/admin/markets/[marketId]/update`
- **Editable:** title, resolution criteria/source, close/resolve times, treasury conviction, season, display order, featured
- **Publish guardrails:** `src/lib/markets/admin-publish-guardrails.ts` — non-blocking warnings in admin UI
- **Resolved/voided:** curation fields only (season, display order, featured)

## Not implemented yet

- Season snapshot tables and automatic $COPE reward payout
- Per-season account rows / Season 2 score reset

## Intentionally separate (not markets)

- `cope-fun:saved-conversations` — local-only room fallback; no market data
- `cope-fun:wallet-session` — temporary local follow gating only; not Privy wallet or staking
- `/u/[username]` — demo profiles from `mock-profiles.ts`; not DB market positions
