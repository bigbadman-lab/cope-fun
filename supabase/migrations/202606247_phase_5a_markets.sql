do $$ begin
  create type market_status as enum ('draft', 'open', 'closed', 'resolved', 'voided');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type market_side as enum ('believe', 'cope');
exception when duplicate_object then null;
end $$;

create table if not exists belief_room_markets (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null unique references belief_rooms(id) on delete restrict,
  title text not null check (char_length(trim(title)) > 0),
  resolution_criteria text not null check (char_length(trim(resolution_criteria)) > 0),
  resolution_source text,
  status market_status not null default 'draft',
  opens_at timestamptz,
  closes_at timestamptz not null,
  resolves_at timestamptz,
  outcome market_side,
  resolved_at timestamptz,
  resolution_notes text,
  believe_pool_credits integer not null default 0 check (believe_pool_credits >= 0),
  cope_pool_credits integer not null default 0 check (cope_pool_credits >= 0),
  participant_count integer not null default 0 check (participant_count >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint belief_room_markets_timing check (
    opens_at is null or closes_at > opens_at
  ),
  constraint belief_room_markets_resolved_state check (
    (status = 'resolved' and outcome is not null and resolved_at is not null)
    or (status <> 'resolved')
  ),
  constraint belief_room_markets_voided_state check (
    (status = 'voided' and outcome is null)
    or (status <> 'voided')
  )
);

create index if not exists belief_room_markets_status_closes_at_idx
  on belief_room_markets (status, closes_at desc);

create table if not exists cope_credit_accounts (
  id uuid primary key default gen_random_uuid(),
  anonymous_session_id uuid not null unique references anonymous_sessions(id) on delete restrict,
  balance_credits integer not null default 1000 check (balance_credits >= 0),
  season_points integer not null default 0 check (season_points >= 0),
  total_staked_credits integer not null default 0 check (total_staked_credits >= 0),
  total_won_credits integer not null default 0 check (total_won_credits >= 0),
  total_lost_credits integer not null default 0 check (total_lost_credits >= 0),
  markets_entered integer not null default 0 check (markets_entered >= 0),
  markets_won integer not null default 0 check (markets_won >= 0),
  markets_lost integer not null default 0 check (markets_lost >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists belief_market_positions (
  id uuid primary key default gen_random_uuid(),
  market_id uuid not null references belief_room_markets(id) on delete restrict,
  anonymous_session_id uuid not null references anonymous_sessions(id) on delete restrict,
  side market_side not null,
  stake_credits integer not null check (stake_credits > 0),
  payout_credits integer,
  is_winner boolean,
  settled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint belief_market_positions_one_per_session unique (market_id, anonymous_session_id)
);

create index if not exists belief_market_positions_market_id_idx
  on belief_market_positions (market_id);

create index if not exists belief_market_positions_session_id_idx
  on belief_market_positions (anonymous_session_id);

create table if not exists cope_credit_ledger_entries (
  id uuid primary key default gen_random_uuid(),
  anonymous_session_id uuid not null references anonymous_sessions(id) on delete restrict,
  market_id uuid references belief_room_markets(id) on delete restrict,
  delta_credits integer not null,
  reason text not null check (char_length(trim(reason)) > 0),
  created_at timestamptz not null default now()
);

create index if not exists cope_credit_ledger_session_id_idx
  on cope_credit_ledger_entries (anonymous_session_id, created_at desc);

alter table belief_room_markets enable row level security;
alter table belief_market_positions enable row level security;
alter table cope_credit_accounts enable row level security;
alter table cope_credit_ledger_entries enable row level security;
