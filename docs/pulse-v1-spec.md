# Cope Pulse v1 Technical Specification

Practical engineering specification for the first Pulse market engine on Cope.fun.

Pulse v1 is a perpetual 15-minute market attached to one existing belief room. MVP launches with **SOL/USD**; the architecture is asset-pair generic. Pulse uses the existing COPE Credit economy, but it does not reuse normal `belief_room_markets` rows for each round because normal markets are one-per-room and admin-resolved. Pulse needs repeated rounds, automatic price capture, and automatic settlement.

---

## Core principles

1. **One belief room can have one attached Pulse Engine.**
2. **One Pulse Engine tracks one asset pair** (MVP: SOL/USD).
3. **One Pulse Engine has exactly one active round at any time.**
4. **WebSocket-first, REST fallback** for price.
5. **The browser never connects directly to CoinGecko.**
6. **Opening and closing prices determine settlement.**
7. **Live price is display/engine state, not a database tick log.**
8. **Existing COPE Credit economy is reused** (accounts, ledger, allowed stakes, parimutuel payout, season points).
9. **Pause does not interrupt a live round**; it prevents the next round from opening.

---

## 1. Product model

**Core flow:**

Admin creates/selects belief room -> Admin attaches Pulse Engine -> Engine waits for fresh price -> Engine opens one 15-minute round -> Users stake Believe/Cope -> Engine captures close price -> Engine settles -> Next round starts unless paused

**Round rule:**

- Capture opening price for the engine's asset pair at round start.
- Capture closing price at round end.
- If closing price is strictly greater than opening price, **Believe wins**.
- Otherwise **Cope wins**.

**Economy rule:**

- Users stake existing COPE Credits.
- Staking debits credits immediately.
- Settlement uses the same parimutuel payout model as normal markets:
  - `payout = floor(user_stake * total_pool / winning_pool)`
  - winners receive payout credits and season points
  - losers receive no balance refund
  - void/review flows are admin-controlled

---

## 2. Asset configuration

**Principle:** one Pulse Engine = one asset pair.

| Field | MVP value | Purpose |
|---|---|---|
| `asset_symbol` | `SOL` | Base asset |
| `quote_currency` | `USD` | Quote currency |
| `provider_asset_id` | CoinGecko id for SOL | Provider subscription key |
| `display_pair` | `SOL/USD` | UI label |

Future engines may use `BTC/USD`, `ETH/USD`, etc. without schema changes.

**Do not hardcode SOL** in service names, worker logic, or UI where a generic `asset_symbol` / `display_pair` is sufficient. Hardcode only at MVP admin create validation if needed.

MVP constraint: only one Pulse engine may be **active** at launch, and it must be SOL/USD. Schema and services remain pair-generic.

---

## 3. Engine health

Engine health is a **first-class concept**, separate from lifecycle state. Health describes the price feed and whether automated settlement may proceed.

| Health | Meaning |
|---|---|
| `healthy` | WebSocket connected; latest price within `stale_after_seconds`; REST fallback not required for current operation |
| `degraded` | WebSocket disconnected or lagging; REST fallback active; latest price still within freshness threshold |
| `offline` | No fresh price available; WebSocket down and REST fallback failed or stale |
| `needs_admin_review` | Settlement paused; stale/untrusted price at open/close; settlement failure; overdue round beyond review threshold; admin action required |

### Health signals

| Signal | Used for |
|---|---|
| WebSocket connected | `healthy` vs `degraded` |
| REST fallback active | `degraded` |
| Latest price freshness (`age <= stale_after_seconds`) | whether open/close may proceed |
| Stale price threshold (`pulse_engines.stale_after_seconds`, default 30s) | freshness cutoff |
| Settlement paused | `needs_admin_review` when close/settle cannot proceed safely |
| Admin action required | `needs_admin_review` until retry/void/recovery |

Health is **derived at runtime** from `CopePriceService` + engine/round state. Optionally cache on engine row (`health`, `health_updated_at`) for fast admin reads; source of truth remains the price service and round records.

**Rules:**

- `healthy` or `degraded` with fresh price: may open/close rounds.
- `offline`: may not open a new round; open round may continue displaying last known price but close requires fresh price or admin review.
- `needs_admin_review`: no new round; no automatic settlement until admin retry/void or recovery succeeds.

---

## 4. Engine state machine

Lifecycle state (`pulse_engines.lifecycle_state`) drives the worker. It is separate from **health** and from **pause intent**.

### Lifecycle states

| State | Meaning |
|---|---|
| `created` | Engine attached to room; not yet receiving price or opening rounds |
| `waiting_for_price` | Active; waiting for first fresh price from price service |
| `ready` | Fresh price available; eligible to open next round |
| `round_open` | Current round is open and stakeable |
| `round_settling` | Round past close; capturing close price and/or settling |
| `round_settled` | Round resolved/voided; transient before next round or pause |
| `next_round` | Transient; worker creating/opening next round |
| `paused` | No active round; pause intent honored; no new rounds until resume |
| `error` | Unrecoverable automatic state; requires admin review or explicit recovery |

### Valid transitions

```
created
  -> waiting_for_price          (admin activates engine)

waiting_for_price
  -> ready                      (fresh price available)
  -> paused                     (admin pause before first round)
  -> error                      (activation/recovery failure)

ready
  -> next_round                 (worker opens round)
  -> paused                     (admin pause; no open round)
  -> waiting_for_price          (price became stale/offline before open)
  -> error                      (open failed)

next_round
  -> round_open                 (round opened with opening price)
  -> error                      (could not capture opening price)

round_open
  -> round_settling             (closes_at reached)
  -> error                      (critical failure while open)

round_settling
  -> round_settled              (settlement complete or void complete)
  -> error                      (settlement failed; health -> needs_admin_review)

round_settled
  -> paused                     (pause_after_current was set)
  -> waiting_for_price          (resume path: need fresh price before next round)
  -> next_round                 (active engine; immediately start next round)

paused
  -> waiting_for_price          (admin resume)

error
  -> waiting_for_price          (admin recovery + fresh price)
  -> paused                     (admin pause from error)
```

### Pause semantics

- **Pause** means `pause_after_current = true` (or lifecycle intent: finish current round, then stop).
- While `round_open`, pause does **not** stop staking or shorten the round.
- After `round_settled`, if pause was requested -> `paused` (not `next_round`).
- **Resume** sets `pause_after_current = false` and transitions `paused -> waiting_for_price`. Engine does **not** open a round until health is acceptable and state reaches `ready -> next_round`.

### Error semantics

- `error` requires admin review or explicit recovery before continuing.
- Typical causes: stale close price, settlement RPC failure, overdue round beyond threshold, inconsistent engine/round pointers.
- Recovery actions: retry settlement, void round, manual price confirmation, resume after fix.

---

## 5. Data model

### `pulse_engines`

One row per perpetual Pulse engine.

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid primary key default gen_random_uuid()` | Engine id |
| `room_id` | `uuid not null references belief_rooms(id) on delete restrict` | Attached belief room; **unique** in v1 |
| `asset_symbol` | `text not null` | e.g. `SOL` |
| `quote_currency` | `text not null` | e.g. `USD` |
| `provider_asset_id` | `text not null` | Provider identifier for WS/REST |
| `display_pair` | `text not null` | e.g. `SOL/USD` for UI |
| `price_provider` | `text not null` | v1: `coingecko_analyst_ws` |
| `round_duration_seconds` | `integer not null default 900` | 15 minutes |
| `lifecycle_state` | enum/text | See state machine |
| `pause_after_current` | `boolean not null default false` | Pause after current round ends |
| `health` | enum/text | `healthy`, `degraded`, `offline`, `needs_admin_review` (cached/derived) |
| `current_round_id` | `uuid null` | FK to active `pulse_rounds.id` |
| `last_round_id` | `uuid null` | Latest completed round |
| `stale_after_seconds` | `integer not null default 30` | Price freshness threshold |
| `created_by_user_id` | `uuid null references app_users(id)` | Admin creator |
| `created_at` | `timestamptz not null default now()` |  |
| `updated_at` | `timestamptz not null default now()` |  |

Recommended constraints:

- `unique(room_id)` — one Pulse engine per room.
- At most one `current_round_id` per engine when lifecycle is `round_open` or `round_settling`.

### `pulse_rounds`

One row per 15-minute round. **Persisted open/close prices are the auditable settlement source.**

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid primary key default gen_random_uuid()` | Round id |
| `engine_id` | `uuid not null references pulse_engines(id)` | Parent engine |
| `room_id` | `uuid not null references belief_rooms(id)` | Denormalized |
| `sequence_number` | `bigint not null` | Monotonic per engine |
| `status` | enum/text | `created`, `open`, `closing`, `resolving`, `resolved`, `voided`, `failed`, `needs_admin_review` |
| `opens_at` | `timestamptz not null` | Scheduled open |
| `closes_at` | `timestamptz not null` | `opens_at + duration` |
| `opened_at` | `timestamptz null` | Actual open time |
| `closed_at` | `timestamptz null` | Actual close time |
| `resolved_at` | `timestamptz null` | Settlement complete |
| `opening_price` | `numeric(20, 8) null` | **Auditable** open price in quote currency |
| `opening_price_source` | `text null` | `coingecko_analyst_ws`, `coingecko_rest`, `admin_recovery` |
| `opening_price_at` | `timestamptz null` | When open price was captured |
| `closing_price` | `numeric(20, 8) null` | **Auditable** close price |
| `closing_price_source` | `text null` | Same source enum as opening |
| `closing_price_at` | `timestamptz null` | When close price was captured |
| `outcome` | `market_side null` | `believe` if close > open, else `cope` |
| `believe_pool_credits` | `integer not null default 0` | Stored counter |
| `cope_pool_credits` | `integer not null default 0` | Stored counter |
| `participant_count` | `integer not null default 0` | Stored counter |
| `failure_reason` | `text null` | Settlement/price errors |
| `admin_review_notes` | `text null` | Recovery trail |
| `created_at` | `timestamptz not null default now()` |  |
| `updated_at` | `timestamptz not null default now()` |  |

Do **not** rely on a tick log for settlement. `opening_price` / `closing_price` on the round row are canonical.

### `pulse_round_positions`

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid primary key default gen_random_uuid()` | Position id |
| `round_id` | `uuid not null references pulse_rounds(id)` | Parent round |
| `engine_id` | `uuid not null references pulse_engines(id)` | Denormalized |
| `user_id` | `uuid not null references app_users(id)` | Authenticated user |
| `side` | `market_side not null` | `believe` or `cope` |
| `stake_credits` | `integer not null` | `ALLOWED_STAKE_AMOUNTS` only |
| `payout_credits` | `integer null` | Set on settlement |
| `is_winner` | `boolean null` | Set on settlement |
| `settled_at` | `timestamptz null` | Settlement/void time |
| `created_at` | `timestamptz not null default now()` |  |
| `updated_at` | `timestamptz not null default now()` |  |

Constraints: `unique(round_id, user_id)`; no position increase/change in v1.

### `pulse_price_snapshots` (optional, MVP-minimal)

**Do not store every WebSocket tick.**

| Use case | Persist? |
|---|---|
| Live UI / engine decisions | In-memory cache only |
| Round open/close settlement | On `pulse_rounds` columns |
| Debug / recovery audit | Optional snapshot rows |

Optional table for **settlement and recovery events only**:

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid primary key` |  |
| `engine_id` | `uuid` |  |
| `round_id` | `uuid null` | Set when tied to open/close/recovery |
| `event_type` | `text` | `round_open`, `round_close`, `recovery`, `debug` |
| `asset_symbol` | `text` |  |
| `quote_currency` | `text` |  |
| `price` | `numeric(20, 8)` |  |
| `source` | `text` | `coingecko_analyst_ws`, `coingecko_rest`, `admin_recovery` |
| `received_at` | `timestamptz` |  |
| `raw_payload` | `jsonb null` | Optional; admin/debug only |

v1 may ship **without** this table if round columns + `admin_review_notes` are sufficient. Prefer round-level persisted prices as the audit trail.

### Relationship to normal markets

Do not attach Pulse rounds to `belief_room_markets`.

Pulse reuses: `app_users`, `cope_credit_accounts`, `cope_credit_ledger_entries`, `market_side`, `ALLOWED_STAKE_AMOUNTS`, parimutuel formula, season points.

Pulse adds: engine, round, position tables; price service; lifecycle worker; Pulse UI.

---

## 6. Admin controls

MVP-simple admin panel for the single Pulse engine.

### Create / attach engine

- Select published `belief_rooms.id`
- Set asset pair (MVP: SOL/USD only at validation layer)
- Set `provider_asset_id`, `round_duration_seconds` (900), `stale_after_seconds` (30)
- Create engine in `created`; activate -> `waiting_for_price`

### Admin dashboard (required fields)

| Field | Source |
|---|---|
| Engine lifecycle state | `pulse_engines.lifecycle_state` |
| Engine health | derived / `pulse_engines.health` |
| Attached room | slug + belief |
| Asset pair | `display_pair` |
| Current round | sequence, status, opens/closes |
| Last price | from price service cache |
| Last price age | `now - receivedAt` |
| Feed mode | `websocket` / `rest_fallback` |
| Next settlement time | current round `closes_at` |
| Pause / resume | `pause_after_current` + lifecycle |
| Recovery | retry settle, void round, acknowledge error |

### Pause

- Sets `pause_after_current = true`
- Current round continues until close and settle
- After settlement -> `paused`; no new round

### Resume

- Clears `pause_after_current`
- `paused -> waiting_for_price`
- Opens new round only after `ready` (fresh price)

### Manual recovery (MVP)

- **Retry settlement** — idempotent on `resolving` / `failed` round
- **Void round** — refund stakes; round `voided`
- **Acknowledge error** — `error -> waiting_for_price` when admin confirms feed restored
- Optional: set `opening_price` / `closing_price` via `admin_recovery` source only in controlled recovery flow

All recovery actions log `admin_review_notes`.

---

## 7. Price feed

### Principles

- Browser **never** connects to CoinGecko.
- **WebSocket-first**, REST fallback.
- **Live price in memory/cache** for display and engine decisions.
- **Persist only open/close** on `pulse_rounds` (optional debug snapshots for recovery).

### `CopePriceService` (server-side)

- One WebSocket connection per active `provider_asset_id` (v1: one SOL feed).
- Normalized in-memory cache per pair:

```ts
type PulseLivePrice = {
  assetSymbol: string;
  quoteCurrency: string;
  displayPair: string;
  price: string;
  source: "coingecko_analyst_ws" | "coingecko_rest";
  feedMode: "websocket" | "rest_fallback";
  providerTimestamp: string | null;
  receivedAt: string;
  ageMs: number;
  isStale: boolean;
};
```

- Public APIs expose cache via `GET /api/rooms/[slug]/pulse` or `GET /api/pulse/price?pair=SOL/USD` — never raw provider payloads to clients.

### REST fallback

When WebSocket disconnected, no recent tick, or age > `stale_after_seconds`:

- Fetch REST price server-side
- Update cache with `feedMode: rest_fallback`
- Health -> `degraded` if price fresh, `offline` if not

### Opening price capture

1. Worker in `next_round` obtains fresh `PulseLivePrice`.
2. Write to round:
   - `opening_price`, `opening_price_source`, `opening_price_at`
   - `opened_at`, `opens_at`, `closes_at`, `status = open`
3. Optionally insert `pulse_price_snapshots` row (`event_type = round_open`).
4. Engine -> `round_open`.

### Closing price capture

1. Worker at `closes_at`: round `open -> closing`.
2. Obtain fresh price (WS or REST).
3. Write `closing_price`, `closing_price_source`, `closing_price_at`, `closed_at`.
4. Compute `outcome`; round -> `resolving`; engine -> `round_settling`.
5. Optionally insert snapshot (`event_type = round_close`).

If close price stale/unavailable: round/engine -> `needs_admin_review`; health -> `needs_admin_review`; settlement paused.

---

## 8. Round lifecycle

### Round statuses

| Status | Meaning |
|---|---|
| `created` | Row exists; opening price not yet set |
| `open` | Stakeable |
| `closing` | Capturing close price |
| `resolving` | Settling positions |
| `resolved` | Complete |
| `voided` | Admin void + refunds |
| `failed` | Settlement error |
| `needs_admin_review` | Cannot trust automatic close/settle |

### Every 15 minutes (happy path)

1. Engine in `round_open`; users stake until `closes_at`.
2. Worker: `round_open` -> `closing` -> capture `closing_price`.
3. `closing` -> `resolving` -> parimutuel settlement.
4. `resolving` -> `resolved`; engine `round_settling` -> `round_settled`.
5. If `pause_after_current`: engine -> `paused`.
6. Else: engine `round_settled` -> `next_round` -> `round_open` (new sequence).

### Worker claiming

- Atomic claim for close and settle transitions.
- Idempotent settlement (`settled_at is null` guard).
- Single active round per engine enforced by `current_round_id` + lifecycle state.

---

## 9. Staking and settlement

### Staking

`POST /api/pulse/rounds/[roundId]/stake`

Validation: authenticated user; round `open`; engine `round_open`; `now() < closes_at`; allowed stake amount; no existing position; sufficient balance.

Writes: debit account; insert position; update pools/participant_count; ledger `pulse stake debit`.

### Settlement

Reuse parimutuel logic from `resolve_market`:

- Winners: payout to balance, `season_points`, `markets_won`, ledger `pulse payout credit`
- Losers: `total_lost_credits`, `markets_lost`
- v1: increment existing `markets_entered` on stake (same as normal markets) unless product splits counters later

### Voiding

Admin void: refund stakes; round `voided`; ledger `pulse void refund`.

---

## 10. Pulse room UI

Pulse replaces normal market header on the attached room only. Debate content stays visible.

### Header / panel

| Element | Notes |
|---|---|
| **LIVE / Pulse badge** | Distinguishes Pulse from normal rooms |
| **Asset pair** | e.g. `SOL/USD` from `display_pair` |
| **Live price** | From server cache; updates via poll/SSE |
| **Opening price** | Current round `opening_price` |
| **Movement vs open** | e.g. `+1.2%` or `$142.50 → $144.20` |
| **Currently winning side** | Believe if live > open, else Cope |
| **Countdown** | Time to `closes_at` |
| **Believe / Cope split** | Pool bar + participant count |
| **Stake controls** | When round `open` and user eligible |

### States

| State | UI |
|---|---|
| Round open | Full stake UI |
| Settling (`closing` / `resolving`) | "Settling round"; staking disabled |
| Paused | "Pulse paused"; no stake |
| Pause after current | "Pausing after this round"; current round still stakeable |
| Stale / needs review | "Price feed needs review"; staking disabled |
| Health degraded | Optional subtle warning; staking allowed if round open and price fresh enough for display |

### Optional micro-interactions (v1 nice-to-have)

- Live price **flashes subtly** on update (brief highlight, no chart).
- **Currently winning side** label/bar **flips** when live price crosses opening price.

### After stake

- Show user position; update pools immediately (shared state pattern like normal market rooms).

---

## 11. MVP non-goals

Explicitly exclude from v1:

- Multi-asset Pulse launch (more than one active engine)
- Charts
- Historical round browser / round history UI
- Storing every price tick in the database
- User-created Pulse engines
- Direct browser-to-CoinGecko connections
- On-chain settlement
- Token payouts
- Leverage
- Adjustable round duration
- Multiple simultaneous Pulse rooms
- Market making / treasury participation
- Advanced analytics

---

## 12. Failure recovery

| Scenario | Behavior |
|---|---|
| WebSocket disconnects | Health `degraded`; REST fallback; reconnect with backoff |
| REST fallback fails | Health `offline`; cannot open/close automatically |
| Price stale at open | Stay `waiting_for_price` / `error`; no new round |
| Price stale at close | Round `needs_admin_review`; settlement paused |
| Settlement fails | Round `failed`/`resolving`; retry idempotent; engine `error` |
| Server restart | Worker reloads engine + round; resume overdue close/settle |
| Round overdue | Close immediately if fresh price; else `needs_admin_review` after threshold (e.g. 300s) |
| Admin pause mid-round | Current round completes; then `paused` |

---

## 13. API surface

### Admin

- `GET /api/admin/pulse/engines`
- `POST /api/admin/pulse/engines`
- `GET /api/admin/pulse/engines/[engineId]`
- `POST /api/admin/pulse/engines/[engineId]/pause`
- `POST /api/admin/pulse/engines/[engineId]/resume`
- `POST /api/admin/pulse/rounds/[roundId]/retry`
- `POST /api/admin/pulse/rounds/[roundId]/void`

### Public / authenticated

- `GET /api/rooms/[slug]/pulse` — engine, round, live price, health, user position
- `POST /api/pulse/rounds/[roundId]/stake`

### Internal

- Price service (WS + REST + cache + health)
- Lifecycle worker (state machine transitions)

---

## 14. Implementation plan

### Stage 1: schema + source-of-truth types

- Migrations: `pulse_engines`, `pulse_rounds`, `pulse_round_positions`; optional `pulse_price_snapshots`
- Types: `src/lib/pulse/types.ts` (lifecycle, health, live price, round view)
- DB helpers: `src/lib/db/pulse-*`

### Stage 2: price service

- Server-side CoinGecko Analyst WebSocket
- In-memory live price cache (no per-tick DB writes)
- REST fallback + stale detection
- Health derivation (`healthy` / `degraded` / `offline`)

### Stage 3: admin engine controls

- Create, pause, resume, dashboard (status, health, feed mode, recovery)
- MVP: single SOL/USD engine validation

### Stage 4: round lifecycle + state machine

- Worker implements lifecycle transitions
- Persist open/close on round rows
- Pause-after-current and resume via `waiting_for_price`

### Stage 5: staking / settlement

- Stake route + RPC
- Reuse parimutuel + season points
- Ledger reasons: `pulse stake debit`, `pulse payout credit`, `pulse void refund`

### Stage 6: Pulse room UI

- LIVE badge, pair, live/open prices, movement, winning side, countdown, pools, stake
- Paused / settling / stale states
- Optional price flash + winning-side flip

### Stage 7: testing / audit

- State machine transition tests
- Health/stale price tests
- Settlement idempotency
- Pause/resume across round boundary
- No browser CoinGecko; no tick log growth

---

## 15. Open decisions before implementation

- Whether Pulse stakes increment `markets_entered` / `markets_won` / `markets_lost` or separate Pulse counters.
- Overdue round: auto-settle with recovery-time price vs mandatory admin review after N seconds.
- First round on activate: immediate vs next aligned 15-minute boundary.
- Whether Pulse appears on `/markets` or only on the attached room in v1.
- Whether optional `pulse_price_snapshots` ships in v1 or only round-level persisted prices.
