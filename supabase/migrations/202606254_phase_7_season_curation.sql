-- Phase 7: Season market curation metadata (order, season assignment, featured).

alter table belief_room_markets
  add column if not exists season_id text not null default 'season-1';

alter table belief_room_markets
  add column if not exists display_order integer null
  check (display_order is null or display_order > 0);

alter table belief_room_markets
  add column if not exists is_featured boolean not null default false;

create unique index if not exists belief_room_markets_season_display_order_unique
  on belief_room_markets (season_id, display_order)
  where display_order is not null;

comment on column belief_room_markets.season_id is
  'Season bucket for curation and public /markets ordering (e.g. season-1).';

comment on column belief_room_markets.display_order is
  'Optional curated sort order within a season. Must be unique per season when set.';

comment on column belief_room_markets.is_featured is
  'Market-level featured flag for curation (distinct from belief_rooms.is_featured).';
