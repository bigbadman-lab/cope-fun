-- Atomic market operations for Phase 5A correctness (stake, resolve, void).

create or replace function stake_on_market(
  p_market_id uuid,
  p_session_id uuid,
  p_side market_side,
  p_stake_credits integer
)
returns jsonb
language plpgsql
as $$
declare
  v_market belief_room_markets%rowtype;
  v_account cope_credit_accounts%rowtype;
  v_position_id uuid;
begin
  if p_stake_credits not in (10, 25, 50, 100, 250) then
    raise exception 'Invalid stake amount.';
  end if;

  select *
  into v_market
  from belief_room_markets
  where id = p_market_id
  for update;

  if not found then
    raise exception 'Market not found.';
  end if;

  if v_market.status <> 'open' then
    raise exception 'Market is not open for staking.';
  end if;

  if now() >= v_market.closes_at then
    raise exception 'Market has closed.';
  end if;

  if exists (
    select 1
    from belief_market_positions
    where market_id = p_market_id
      and anonymous_session_id = p_session_id
  ) then
    raise exception 'You already have a position in this market.';
  end if;

  select *
  into v_account
  from cope_credit_accounts
  where anonymous_session_id = p_session_id
  for update;

  if not found then
    raise exception 'Credit account not found.';
  end if;

  if v_account.balance_credits < p_stake_credits then
    raise exception 'Insufficient credits.';
  end if;

  update cope_credit_accounts
  set
    balance_credits = balance_credits - p_stake_credits,
    total_staked_credits = total_staked_credits + p_stake_credits,
    markets_entered = markets_entered + 1,
    updated_at = now()
  where id = v_account.id;

  insert into belief_market_positions (
    market_id,
    anonymous_session_id,
    side,
    stake_credits
  )
  values (p_market_id, p_session_id, p_side, p_stake_credits)
  returning id into v_position_id;

  if p_side = 'believe' then
    update belief_room_markets
    set
      believe_pool_credits = believe_pool_credits + p_stake_credits,
      participant_count = participant_count + 1,
      updated_at = now()
    where id = p_market_id;
  else
    update belief_room_markets
    set
      cope_pool_credits = cope_pool_credits + p_stake_credits,
      participant_count = participant_count + 1,
      updated_at = now()
    where id = p_market_id;
  end if;

  insert into cope_credit_ledger_entries (
    anonymous_session_id,
    market_id,
    delta_credits,
    reason
  )
  values (p_session_id, p_market_id, -p_stake_credits, 'stake debit');

  return jsonb_build_object(
    'position_id', v_position_id,
    'balance_credits', v_account.balance_credits - p_stake_credits
  );
end;
$$;

create or replace function resolve_market(
  p_market_id uuid,
  p_outcome market_side,
  p_notes text default null
)
returns void
language plpgsql
as $$
declare
  v_market belief_room_markets%rowtype;
  v_position belief_market_positions%rowtype;
  v_winning_pool integer;
  v_total_pool integer;
  v_payout integer;
  v_now timestamptz := now();
begin
  select *
  into v_market
  from belief_room_markets
  where id = p_market_id
  for update;

  if not found then
    raise exception 'Market not found.';
  end if;

  if v_market.status = 'resolved' then
    return;
  end if;

  if v_market.status <> 'closed' then
    raise exception 'Market must be closed before resolution.';
  end if;

  v_winning_pool := case
    when p_outcome = 'believe' then v_market.believe_pool_credits
    else v_market.cope_pool_credits
  end;
  v_total_pool := v_market.believe_pool_credits + v_market.cope_pool_credits;

  for v_position in
    select *
    from belief_market_positions
    where market_id = p_market_id
      and settled_at is null
    for update
  loop
    if v_position.side = p_outcome then
      if v_winning_pool > 0 and v_total_pool > 0 then
        v_payout := floor(
          (v_position.stake_credits::numeric * v_total_pool) / v_winning_pool
        )::integer;
      else
        v_payout := 0;
      end if;

      update belief_market_positions
      set
        payout_credits = v_payout,
        is_winner = true,
        settled_at = v_now,
        updated_at = v_now
      where id = v_position.id
        and settled_at is null;

      if found then
        update cope_credit_accounts
        set
          balance_credits = balance_credits + v_payout,
          total_won_credits = total_won_credits + v_payout,
          season_points = season_points + v_payout,
          markets_won = markets_won + 1,
          updated_at = v_now
        where anonymous_session_id = v_position.anonymous_session_id;

        if v_payout > 0 then
          insert into cope_credit_ledger_entries (
            anonymous_session_id,
            market_id,
            delta_credits,
            reason
          )
          values (
            v_position.anonymous_session_id,
            p_market_id,
            v_payout,
            'market payout credit'
          );
        end if;
      end if;
    else
      update belief_market_positions
      set
        payout_credits = 0,
        is_winner = false,
        settled_at = v_now,
        updated_at = v_now
      where id = v_position.id
        and settled_at is null;

      if found then
        update cope_credit_accounts
        set
          total_lost_credits = total_lost_credits + v_position.stake_credits,
          markets_lost = markets_lost + 1,
          updated_at = v_now
        where anonymous_session_id = v_position.anonymous_session_id;
      end if;
    end if;
  end loop;

  update belief_room_markets
  set
    status = 'resolved',
    outcome = p_outcome,
    resolved_at = v_now,
    resolution_notes = nullif(trim(p_notes), ''),
    updated_at = v_now
  where id = p_market_id
    and status = 'closed';
end;
$$;

create or replace function void_market(
  p_market_id uuid,
  p_notes text default null
)
returns void
language plpgsql
as $$
declare
  v_market belief_room_markets%rowtype;
  v_position belief_market_positions%rowtype;
  v_now timestamptz := now();
begin
  select *
  into v_market
  from belief_room_markets
  where id = p_market_id
  for update;

  if not found then
    raise exception 'Market not found.';
  end if;

  if v_market.status = 'voided' then
    return;
  end if;

  if v_market.status = 'resolved' then
    raise exception 'Resolved markets cannot be voided.';
  end if;

  for v_position in
    select *
    from belief_market_positions
    where market_id = p_market_id
      and settled_at is null
    for update
  loop
    update belief_market_positions
    set
      payout_credits = v_position.stake_credits,
      is_winner = null,
      settled_at = v_now,
      updated_at = v_now
    where id = v_position.id
      and settled_at is null;

    if found then
      update cope_credit_accounts
      set
        balance_credits = balance_credits + v_position.stake_credits,
        updated_at = v_now
      where anonymous_session_id = v_position.anonymous_session_id;

      insert into cope_credit_ledger_entries (
        anonymous_session_id,
        market_id,
        delta_credits,
        reason
      )
      values (
        v_position.anonymous_session_id,
        p_market_id,
        v_position.stake_credits,
        'void refund'
      );
    end if;
  end loop;

  update belief_room_markets
  set
    status = 'voided',
    outcome = null,
    resolved_at = v_now,
    resolution_notes = nullif(trim(p_notes), ''),
    updated_at = v_now
  where id = p_market_id
    and status <> 'resolved';
end;
$$;
