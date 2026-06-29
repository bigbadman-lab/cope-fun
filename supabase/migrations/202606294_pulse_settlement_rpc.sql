-- Pulse round settlement: parimutuel payouts, draw refunds, ledger entries, idempotent settle.

alter table pulse_positions
  add column if not exists payout_credits integer,
  add column if not exists is_winner boolean,
  add column if not exists settled_at timestamptz;

create index if not exists pulse_positions_round_settled_idx
  on pulse_positions (round_id, settled_at)
  where settled_at is not null;

create or replace function settle_pulse_round(p_round_id uuid)
returns jsonb
language plpgsql
as $$
declare
  v_round pulse_rounds%rowtype;
  v_position pulse_positions%rowtype;
  v_winning_pool integer;
  v_total_pool integer;
  v_losing_pool integer;
  v_payout integer;
  v_now timestamptz := now();
  v_positions_settled integer := 0;
  v_credits_paid integer := 0;
begin
  select *
  into v_round
  from pulse_rounds
  where id = p_round_id
  for update;

  if not found then
    raise exception 'Pulse round not found.';
  end if;

  v_total_pool := v_round.believe_pool + v_round.cope_pool;

  v_winning_pool := case
    when v_round.winning_side = 'believe' then v_round.believe_pool
    when v_round.winning_side = 'cope' then v_round.cope_pool
    else 0
  end;
  v_losing_pool := v_total_pool - v_winning_pool;

  if v_round.status = 'settled' then
    select
      coalesce(count(*), 0),
      coalesce(sum(payout_credits), 0)
    into v_positions_settled, v_credits_paid
    from pulse_positions
    where round_id = p_round_id
      and settled_at is not null;

    return jsonb_build_object(
      'winning_side', v_round.winning_side,
      'total_pool', v_total_pool,
      'winning_pool', v_winning_pool,
      'losing_pool', v_losing_pool,
      'positions_settled', v_positions_settled,
      'credits_paid', v_credits_paid,
      'already_settled', true
    );
  end if;

  if v_round.status <> 'locked' then
    raise exception 'Pulse round must be locked before settlement.';
  end if;

  if v_round.winning_side is null then
    raise exception 'Pulse round is missing a winning side.';
  end if;

  for v_position in
    select *
    from pulse_positions
    where round_id = p_round_id
      and settled_at is null
    order by id
    for update
  loop
    if v_round.winning_side = 'draw' then
      v_payout := v_position.stake_amount;

      update pulse_positions
      set
        payout_credits = v_payout,
        is_winner = null,
        settled_at = v_now,
        updated_at = v_now
      where id = v_position.id
        and settled_at is null;

      if found then
        v_positions_settled := v_positions_settled + 1;

        if v_position.user_id is not null then
          update cope_credit_accounts
          set
            balance_credits = balance_credits + v_payout,
            updated_at = v_now
          where user_id = v_position.user_id;

          insert into cope_credit_ledger_entries (
            user_id,
            pulse_round_id,
            delta_credits,
            reason
          )
          values (
            v_position.user_id,
            p_round_id,
            v_payout,
            'pulse draw refund'
          );

          v_credits_paid := v_credits_paid + v_payout;
        end if;
      end if;
    elsif v_position.side = v_round.winning_side then
      if v_winning_pool > 0 and v_total_pool > 0 then
        v_payout := floor(
          (v_position.stake_amount::numeric * v_total_pool) / v_winning_pool
        )::integer;
      else
        v_payout := 0;
      end if;

      update pulse_positions
      set
        payout_credits = v_payout,
        is_winner = true,
        settled_at = v_now,
        updated_at = v_now
      where id = v_position.id
        and settled_at is null;

      if found then
        v_positions_settled := v_positions_settled + 1;

        if v_position.user_id is not null then
          update cope_credit_accounts
          set
            balance_credits = balance_credits + v_payout,
            total_won_credits = total_won_credits + v_payout,
            season_points = season_points + v_payout,
            markets_won = markets_won + 1,
            updated_at = v_now
          where user_id = v_position.user_id;

          if v_payout > 0 then
            insert into cope_credit_ledger_entries (
              user_id,
              pulse_round_id,
              delta_credits,
              reason
            )
            values (
              v_position.user_id,
              p_round_id,
              v_payout,
              'pulse payout credit'
            );

            v_credits_paid := v_credits_paid + v_payout;
          end if;
        end if;
      end if;
    else
      update pulse_positions
      set
        payout_credits = 0,
        is_winner = false,
        settled_at = v_now,
        updated_at = v_now
      where id = v_position.id
        and settled_at is null;

      if found then
        v_positions_settled := v_positions_settled + 1;

        if v_position.user_id is not null then
          update cope_credit_accounts
          set
            total_lost_credits = total_lost_credits + v_position.stake_amount,
            markets_lost = markets_lost + 1,
            updated_at = v_now
          where user_id = v_position.user_id;
        end if;
      end if;
    end if;
  end loop;

  update pulse_rounds
  set
    status = 'settled',
    settled_at = coalesce(settled_at, v_now)
  where id = p_round_id
    and status = 'locked';

  return jsonb_build_object(
    'winning_side', v_round.winning_side,
    'total_pool', v_total_pool,
    'winning_pool', v_winning_pool,
    'losing_pool', v_losing_pool,
    'positions_settled', v_positions_settled,
    'credits_paid', v_credits_paid,
    'already_settled', false
  );
end;
$$;
