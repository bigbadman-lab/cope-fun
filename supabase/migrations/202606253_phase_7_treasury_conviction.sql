-- Phase 7: Treasury Conviction (display-only $COPE allocation per market).

alter table belief_room_markets
  add column if not exists treasury_conviction_cope bigint not null default 0
  check (treasury_conviction_cope >= 0);

comment on column belief_room_markets.treasury_conviction_cope is
  'Display-only protocol $COPE allocation signal for MVP. Does not affect credit settlement.';
