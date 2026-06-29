-- Pulse staking: atomic credit debit, position insert, pool update, and ledger entry.

alter table cope_credit_ledger_entries
  add column if not exists pulse_round_id uuid references pulse_rounds(id) on delete restrict;

create index if not exists cope_credit_ledger_entries_pulse_round_id_idx
  on cope_credit_ledger_entries (pulse_round_id, created_at desc)
  where pulse_round_id is not null;

create or replace function stake_on_pulse_round_for_user(
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
  v_account cope_credit_accounts%rowtype;
  v_position_id uuid;
begin
  if p_user_id is null then
    raise exception 'User id is required.';
  end if;

  if p_stake_amount is null or p_stake_amount < 1 or p_stake_amount > 1000 then
    raise exception 'Stake amount must be an integer between 1 and 1000.';
  end if;

  if p_side not in ('believe', 'cope') then
    raise exception 'Invalid stake side.';
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

  if v_round.closes_at is not null and now() >= v_round.closes_at then
    raise exception 'Pulse round has closed.';
  end if;

  select *
  into v_account
  from cope_credit_accounts
  where user_id = p_user_id
  for update;

  if not found then
    raise exception 'Credit account not found.';
  end if;

  if v_account.balance_credits < p_stake_amount then
    raise exception 'Insufficient credits.';
  end if;

  update cope_credit_accounts
  set
    balance_credits = balance_credits - p_stake_amount,
    total_staked_credits = total_staked_credits + p_stake_amount,
    updated_at = now()
  where id = v_account.id;

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

  insert into cope_credit_ledger_entries (
    user_id,
    pulse_round_id,
    delta_credits,
    reason
  )
  values (p_user_id, p_round_id, -p_stake_amount, 'pulse stake debit');

  select *
  into v_round
  from pulse_rounds
  where id = p_round_id;

  return jsonb_build_object(
    'position_id', v_position_id,
    'balance_credits', v_account.balance_credits - p_stake_amount,
    'round_id', v_round.id,
    'round_number', v_round.round_number,
    'round_status', v_round.status,
    'believe_pool', v_round.believe_pool,
    'cope_pool', v_round.cope_pool
  );
end;
$$;
