-- Phase 6A: Privy app users and signed-in market credits.

create table if not exists app_users (
  id uuid primary key default gen_random_uuid(),
  privy_user_id text not null unique,
  wallet_address text,
  email text,
  display_name text,
  linked_anonymous_session_id uuid references anonymous_sessions(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_seen_at timestamptz
);

create index if not exists app_users_linked_anonymous_session_id_idx
  on app_users (linked_anonymous_session_id)
  where linked_anonymous_session_id is not null;

alter table belief_rooms
  add column if not exists created_by_user_id uuid references app_users(id) on delete set null;

create index if not exists belief_rooms_created_by_user_id_idx
  on belief_rooms (created_by_user_id)
  where created_by_user_id is not null;

-- cope_credit_accounts: support signed-in accounts keyed by user_id.
alter table cope_credit_accounts
  alter column anonymous_session_id drop not null;

alter table cope_credit_accounts
  add column if not exists user_id uuid references app_users(id) on delete restrict;

alter table cope_credit_accounts
  drop constraint if exists cope_credit_accounts_anonymous_session_id_key;

create unique index if not exists cope_credit_accounts_anonymous_session_id_unique
  on cope_credit_accounts (anonymous_session_id)
  where anonymous_session_id is not null;

create unique index if not exists cope_credit_accounts_user_id_unique
  on cope_credit_accounts (user_id)
  where user_id is not null;

alter table cope_credit_ledger_entries
  alter column anonymous_session_id drop not null;

alter table cope_credit_ledger_entries
  add column if not exists user_id uuid references app_users(id) on delete restrict;

create index if not exists cope_credit_ledger_entries_user_id_idx
  on cope_credit_ledger_entries (user_id, created_at desc)
  where user_id is not null;

alter table belief_market_positions
  alter column anonymous_session_id drop not null;

alter table belief_market_positions
  add column if not exists user_id uuid references app_users(id) on delete restrict;

create unique index if not exists belief_market_positions_market_user_unique
  on belief_market_positions (market_id, user_id)
  where user_id is not null;

create index if not exists belief_market_positions_user_id_idx
  on belief_market_positions (user_id)
  where user_id is not null;

alter table app_users enable row level security;

-- New accounts start at 0; signed-in users receive the Season 1 grant explicitly.
alter table cope_credit_accounts
  alter column balance_credits set default 0;

create unique index if not exists cope_credit_ledger_initial_grant_user_unique
  on cope_credit_ledger_entries (user_id, reason)
  where user_id is not null and reason = 'initial_season_grant';
