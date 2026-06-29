create table if not exists pulse_positions (
  id uuid primary key default gen_random_uuid(),
  round_id uuid not null references pulse_rounds(id) on delete cascade,
  engine_id uuid not null references pulse_engines(id) on delete cascade,
  user_id uuid references app_users(id) on delete restrict,
  wallet_address text,
  side text not null,
  stake_amount integer not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint pulse_positions_side_check check (side in ('believe', 'cope')),
  constraint pulse_positions_stake_amount_positive check (stake_amount > 0),
  constraint pulse_positions_identity_required check (
    user_id is not null
    or (wallet_address is not null and char_length(trim(wallet_address)) > 0)
  )
);

create unique index if not exists pulse_positions_round_user_side_unique
  on pulse_positions (round_id, user_id, side)
  where user_id is not null;

create unique index if not exists pulse_positions_round_wallet_side_unique
  on pulse_positions (round_id, wallet_address, side)
  where wallet_address is not null;

create index if not exists pulse_positions_round_id_idx
  on pulse_positions (round_id);

create index if not exists pulse_positions_engine_id_idx
  on pulse_positions (engine_id);

create index if not exists pulse_positions_user_id_idx
  on pulse_positions (user_id)
  where user_id is not null;

create index if not exists pulse_positions_wallet_address_idx
  on pulse_positions (wallet_address)
  where wallet_address is not null;

create index if not exists pulse_positions_round_side_idx
  on pulse_positions (round_id, side);

drop trigger if exists pulse_positions_set_updated_at_trigger on pulse_positions;
create trigger pulse_positions_set_updated_at_trigger
before update on pulse_positions
for each row
execute function pulse_set_updated_at();

alter table pulse_positions enable row level security;

create or replace function create_pulse_position(
  p_round_id uuid,
  p_engine_id uuid,
  p_user_id uuid,
  p_wallet_address text,
  p_side text,
  p_stake_amount integer
)
returns jsonb
language plpgsql
as $$
declare
  v_round pulse_rounds%rowtype;
  v_position_id uuid;
begin
  if p_stake_amount is null or p_stake_amount <= 0 then
    raise exception 'Stake amount must be greater than zero.';
  end if;

  if p_side not in ('believe', 'cope') then
    raise exception 'Invalid stake side.';
  end if;

  if p_user_id is null and (p_wallet_address is null or char_length(trim(p_wallet_address)) = 0) then
    raise exception 'User id or wallet address is required.';
  end if;

  select *
  into v_round
  from pulse_rounds
  where id = p_round_id
  for update;

  if not found then
    raise exception 'Pulse round not found.';
  end if;

  if v_round.engine_id <> p_engine_id then
    raise exception 'Pulse engine does not match round.';
  end if;

  if v_round.status <> 'open' then
    raise exception 'Pulse round is not open for staking.';
  end if;

  insert into pulse_positions (
    round_id,
    engine_id,
    user_id,
    wallet_address,
    side,
    stake_amount
  )
  values (
    p_round_id,
    p_engine_id,
    p_user_id,
    nullif(trim(p_wallet_address), ''),
    p_side,
    p_stake_amount
  )
  returning id into v_position_id;

  if p_side = 'believe' then
    update pulse_rounds
    set believe_pool = believe_pool + p_stake_amount
    where id = p_round_id;
  else
    update pulse_rounds
    set cope_pool = cope_pool + p_stake_amount
    where id = p_round_id;
  end if;

  return jsonb_build_object('position_id', v_position_id);
end;
$$;
