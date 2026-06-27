# Cope.fun Market Spec v1

Canonical product and engineering specification for MVP markets. Engineering implementation notes live in [market-source-of-truth.md](./market-source-of-truth.md).

---

## 1. Product principle

Markets are not the starting point of Cope. A market is a **curated evolution of a belief room**.

**Flow:**

Belief → Agent debate → Community vote → Admin selection → Market → Resolution → Season result

Users express beliefs and stress-test them with agents. Community voting surfaces conviction. Admins promote selected belief rooms into tradable markets. Markets resolve against objective criteria. Season outcomes reward participation.

---

## 2. MVP market model

- **Season 1** launches with **10 admin-created markets**.
- Users **cannot** create markets directly.
- Each market attaches to **one existing belief room** (`belief_room_markets.room_id` is unique).
- **One belief room** can have **at most one market**.
- Markets are **created, published, closed, resolved, or voided by admin only**.
- Public market discovery uses **`/markets`**. Market detail and staking UI live on **room pages** (`/room/[slug]`), not standalone `/markets/[id]` pages.

---

## 3. Data source of truth

- **Supabase** is the only source of truth for markets.
- No localStorage, random, hash-based, or mock market generation.
- Market data comes from `belief_room_markets` and related DB-backed helpers in `src/lib/db/markets.ts`, `market-admin.ts`, `market-staking.ts`, `market-settlement.ts`.
- Canonical TypeScript types: `src/lib/markets/types.ts`.
- **Local saved rooms** (`cope-fun:saved-conversations`) may exist only as a fallback belief archive. They **cannot** have markets. DB-backed rooms are required for market attachment.

---

## 4. COPE Credits

- Users trade with **COPE Credits**, not direct **$COPE**.
- COPE Credits are **user-scoped** through Privy → `app_users` → `cope_credit_accounts`.
- **Anonymous users cannot stake** in markets (staking API requires authenticated app user).
- Credits are used for **gameplay**, **leaderboard ranking**, and **Season participation**.
- Credits are **not** direct token balances and are **not** redeemable for $COPE unless a separate reward program explicitly says so.

**Initial grant:** Signed-in users receive a one-time Season grant (currently 1000 credits, reason `initial_season_grant`) on first account creation via auth sync.

---

## 5. $COPE token relationship

- **Day 1 MVP** does not require direct $COPE staking.
- **$COPE** may be used as a **Season reward / incentive pool** (off-chain distribution to `app_users.wallet_address`).
- **Treasury Conviction** may display protocol-backed $COPE allocation per market.
- Treasury Conviction is **display / incentive signalling** for MVP unless explicitly upgraded later.
- Do **not** treat Treasury Conviction as an automated AMM, order book, or claimable user counterparty without a separate spec.

---

## 6. Treasury Conviction

**Status:** Implemented (Release 0.95 Phase 3) — **display-only**.

- Treasury Conviction is a **protocol/team allocation of $COPE** associated with a market.
- It signals that Cope has committed **incentive weight** to that market.
- Stored on **`belief_room_markets.treasury_conviction_cope`** (`bigint`, default `0`, non-negative).
- TypeScript field: **`treasuryConvictionCope`** on `PublicMarket` / `AdminMarketRow` in `src/lib/markets/types.ts`.
- **Admin-managed** via `/admin` at draft create and editable after create (Release 0.96).
- Display publicly when `> 0` on `/markets` rows and room `RoomMarketPanel`.
- Formatting: `formatWholeAmount()` in `src/lib/markets/format-amount.ts`.
- Must **not** affect COPE Credit balances, staking, settlement, pool percentages, leaderboard, or payouts in MVP.

---

## 7. Market lifecycle

### Statuses

| DB status | Public display | Notes |
|-----------|----------------|-------|
| `draft` | Admin only | Not listed publicly |
| `open` | Open | Stakeable while before `closes_at` |
| `open` (past close) | Awaiting resolution | Staking disabled; admin must close/resolve |
| `closed` | Closed / awaiting resolution | Admin action required |
| `resolved` | Resolved | Outcome set (Believe or Cope) |
| `voided` | Voided | Positions neutralized/refunded per settlement logic |

Display status logic: `src/lib/markets/display-status.ts` (`awaiting_resolution` when `open` and past `closes_at`).

### Rules

- **Draft** markets are admin-only.
- **Open** markets are visible and stakeable (until close time).
- **Past close time** disables staking even if DB status is still `open`.
- **Closed / awaiting resolution** markets require admin close → resolve or void.
- **Resolved** markets settle winning positions via DB RPC (`resolve_market`).
- **Voided** markets refund or neutralize positions via DB RPC (`void_market`).

---

## 8. Trading / staking

- Users stake **fixed allowed amounts** of COPE Credits.
- **Allowed amounts** (canonical): `[10, 25, 50, 100, 250]` — `ALLOWED_STAKE_AMOUNTS` in `src/lib/markets/types.ts`.
- **One position per user per market** (DB unique index on `market_id` + `user_id`). Increasing stake on an existing position is **not** supported unless product and RPC are explicitly changed.
- Staking goes through **`POST /api/markets/[marketId]/stake`** → RPC `stake_on_market_for_user`.
- **Do not expose** anonymous staking routes. Legacy anonymous RPC exists in migrations but must remain unused in API.

---

## 9. Portfolio

A user portfolio (currently **`/profile`**) should show:

- Available credits (`balance_credits`)
- Open positions (unsettled, market still active)
- Resolved positions (settled win/loss/void)
- Market side (Believe / Cope)
- Stake amount
- Outcome / payout where available
- Season rank and eligibility where available (`markets_entered >= 1` for leaderboard qualification)
- **Season points** as primary season score (`season_points` on credit account)

---

## 10. Leaderboard

- Leaderboard represents the **active season** (from `src/lib/seasons.ts`).
- **Ranking (MVP Season 1):** `cope_credit_accounts.season_points` DESC, then `markets_won` DESC, then `total_won_credits` DESC, then `updated_at` ASC, then `created_at` ASC.
- Shared order: `src/lib/leaderboard/ranking.ts` — used by `leaderboard.ts` and profile rank.
- **Minimum eligibility:** `markets_entered >= 1` (`LEADERBOARD_MIN_MARKETS_ENTERED`).
- **`season_points` population:** Increased on winning market resolution via `resolve_market` RPC (same payout amount as credit winnings). No migration changes required for MVP.
- **MVP limitation:** `season_points` on `cope_credit_accounts` is treated as the **active Season 1 score**. There is no per-season row history yet. Before Season 2, add season-scoped snapshots or per-season account rows and reset/archive logic.
- **Rewards:** Final $COPE reward distribution is **not automatically implemented** at MVP launch. Snapshot/reward tables remain future work.

---

## 11. Market resolution

- Admin resolves a market as **Believe**, **Cope**, or **Void**.
- Resolution updates positions, credits, ledger entries, and stats through DB-backed RPCs (`resolve_market`, `void_market`).
- Every published market must have **clear, written resolution criteria** before publish (`resolution_criteria`, optional `resolution_source`).
- Admin should **not** publish markets that cannot be **objectively resolved**.

---

## 12. Admin rules

- Admin creates markets from **eligible belief rooms** (`is_market_candidate = true`, published, no existing market).
- Admin can **create draft, edit metadata, publish, close, resolve, or void** markets via `/admin` and `/api/admin/markets/*`.
- Admin should define for each market:
  - **Market title** — stored on `belief_room_markets.title` (separate from room `belief`; defaults from room belief at create)
  - Resolution criteria (`resolution_criteria`, optional `resolution_source`)
  - Close time (`closes_at`, optional `resolves_at`)
  - Season (`season_id`, e.g. `season-1`)
  - Display order (`display_order`, optional unique per season)
  - Featured flag (`is_featured`)
  - Treasury Conviction amount (`treasury_conviction_cope`)
- **Edit API (Release 0.96):** `POST /api/admin/markets/[marketId]/update` — editable fields above; resolved/voided markets allow curation fields only.
- **Publish guardrails:** Non-blocking warnings in admin when resolution criteria, future close time, display order, or Treasury Conviction are missing.
- **Preview links:** Admin links to `/room/[slug]` for room and public page (no separate market detail route in MVP).
- **MVP auth:** shared admin password + `ADMIN_SECRET` cookie session (`src/lib/admin/auth.ts`). Acceptable for pre-launch only if secret is strong.
- **Longer term:** DB-backed admin roles linked to `app_users`.

---

## 13. Season 1 launch requirements

Before launch:

- [ ] Exactly **10 published** Season 1 markets (admin-curated — **not seeded in Phase 5**)
- [ ] Display orders **1–10** assigned (unique per `season_id`)
- [ ] All markets have **clear resolution criteria**
- [ ] All fake/prototype market code **removed or isolated** (Release 0.9)
- [ ] **Lint and typecheck pass**
- [ ] Treasury Conviction **implemented** (display-only DB field)
- [ ] Leaderboard **Season logic confirmed** (Release 0.95 Phase 4)
- [ ] **Season curation infrastructure** in place (Release 0.95 Phase 5)
- [ ] Admin resolution flow **tested end-to-end**
- [ ] **Admin market operations** ready — edit metadata from `/admin` without SQL (Release 0.96)

Season 1 launch should be operated entirely from `/admin`. The first 10 markets are **not seeded by code**.

---

## 14. Season market curation (Phase 5)

- **Migration:** `202606254_phase_7_season_curation.sql` — `season_id`, `display_order`, `is_featured`
- **Helpers:** `src/lib/markets/season-curation.ts` — validation, public sort, launch checklist
- **Admin API:** `POST /api/admin/markets/[marketId]/curation` (legacy; unified edit uses `/update`)
- **Admin edit API (0.96):** `POST /api/admin/markets/[marketId]/update`
- **Public `/markets` order:** current season → featured → `display_order` → `created_at`
- **Launch checklist:** read-only in `/admin` — launch markets, ordered, treasury, criteria, future close time, published/open, draft count (X / 10 where applicable)
- **MVP limitation:** no auto-seed; Season 1 markets created manually before launch
- **Before Season 2:** season snapshots or score reset strategy

---

## 15. Non-goals for MVP

- Permissionless market creation
- Direct user staking with $COPE
- On-chain settlement
- Order books
- AMMs
- Public market creation by users
- Complex derivatives or leverage
- Treating COPE Credits as redeemable token balances

---

## 16. Engineering guardrails

- Prefer **`src/lib/markets/types.ts`** for canonical market types.
- Do **not** reintroduce mock market models (`mock-markets`, `market.ts`, `market-types.ts`, etc.).
- Do **not** add market data to `SavedConversation` / localStorage.
- Do **not** create duplicate wallet/session systems for market access (Privy + `app_users` only for staking/credits).
- DB-backed market helpers and APIs remain the **only active market path**:
  - `src/lib/db/markets.ts`
  - `src/lib/db/market-admin.ts`
  - `src/lib/db/market-staking.ts`
  - `src/lib/db/market-settlement.ts`
  - `src/lib/db/credits.ts`
  - `/api/rooms/[slug]/market`
  - `/api/markets/[marketId]/stake`
  - `/api/admin/markets/create`
  - `/api/admin/markets/[marketId]/action`
  - `/api/admin/markets/[marketId]/update`
  - `/api/admin/markets/[marketId]/curation`
