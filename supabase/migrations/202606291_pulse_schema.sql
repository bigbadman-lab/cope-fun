create table if not exists pulse_engines (
  id uuid primary key default gen_random_uuid(),
  belief_room_id uuid not null references belief_rooms(id) on delete restrict,
  asset_symbol text not null default 'SOL',
  quote_currency text not null default 'USD',
  provider_asset_id text not null default 'solana',
  display_pair text not null default 'SOL/USD',
  lifecycle_state text not null default 'draft',
  health text not null default 'offline',
  pause_after_current boolean not null default false,
  round_duration_seconds integer not null default 900,
  active_round_id uuid null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint pulse_engines_belief_room_unique unique (belief_room_id),
  constraint pulse_engines_lifecycle_state_check check (
    lifecycle_state in (
      'draft',
      'ready',
      'running',
      'paused',
      'pausing',
      'settling',
      'errored',
      'disabled',
      'archived'
    )
  ),
  constraint pulse_engines_health_check check (
    health in (
      'healthy',
      'degraded',
      'offline',
      'needs_admin_review'
    )
  ),
  constraint pulse_engines_round_duration_positive check (round_duration_seconds > 0)
);

create table if not exists pulse_rounds (
  id uuid primary key default gen_random_uuid(),
  engine_id uuid not null references pulse_engines(id) on delete restrict,
  round_number integer not null,
  status text not null default 'pending',
  opened_at timestamptz null,
  closes_at timestamptz null,
  settled_at timestamptz null,
  opening_price numeric null,
  opening_price_source text null,
  opening_price_at timestamptz null,
  closing_price numeric null,
  closing_price_source text null,
  closing_price_at timestamptz null,
  winning_side text null,
  believe_pool integer not null default 0,
  cope_pool integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint pulse_rounds_engine_round_number_unique unique (engine_id, round_number),
  constraint pulse_rounds_round_number_positive check (round_number > 0),
  constraint pulse_rounds_status_check check (
    status in (
      'pending',
      'open',
      'locked',
      'settling',
      'settled',
      'cancelled',
      'errored'
    )
  ),
  constraint pulse_rounds_winning_side_check check (
    winning_side is null
    or winning_side in ('believe', 'cope', 'draw')
  ),
  constraint pulse_rounds_pools_non_negative check (
    believe_pool >= 0
    and cope_pool >= 0
  )
);

alter table pulse_engines
  drop constraint if exists pulse_engines_active_round_id_fkey;

alter table pulse_engines
  add constraint pulse_engines_active_round_id_fkey
  foreign key (active_round_id)
  references pulse_rounds(id)
  on delete set null;

create index if not exists pulse_engines_belief_room_id_idx
  on pulse_engines (belief_room_id);

create index if not exists pulse_engines_lifecycle_health_idx
  on pulse_engines (lifecycle_state, health);

create index if not exists pulse_rounds_engine_status_idx
  on pulse_rounds (engine_id, status);

create index if not exists pulse_rounds_closes_at_idx
  on pulse_rounds (closes_at)
  where closes_at is not null;

create or replace function pulse_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists pulse_engines_set_updated_at_trigger on pulse_engines;
create trigger pulse_engines_set_updated_at_trigger
before update on pulse_engines
for each row
execute function pulse_set_updated_at();

drop trigger if exists pulse_rounds_set_updated_at_trigger on pulse_rounds;
create trigger pulse_rounds_set_updated_at_trigger
before update on pulse_rounds
for each row
execute function pulse_set_updated_at();

alter table pulse_engines enable row level security;
alter table pulse_rounds enable row level security;
