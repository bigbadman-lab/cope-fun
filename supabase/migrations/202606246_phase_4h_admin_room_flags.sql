alter table belief_rooms
  add column if not exists is_hidden boolean not null default false,
  add column if not exists is_featured boolean not null default false,
  add column if not exists is_market_candidate boolean not null default false;

create index if not exists belief_rooms_public_listing_idx
  on belief_rooms (status, is_hidden, created_at desc)
  where status = 'published';

create or replace function search_belief_rooms(
  search_query text,
  result_limit integer default 20
)
returns table (
  id uuid,
  slug text,
  belief text,
  room_title text,
  search_summary text,
  created_at timestamptz,
  challenge_count integer,
  rank real
)
language sql
stable
as $$
  with query as (
    select websearch_to_tsquery('english', search_query) as tsq
  )
  select
    br.id,
    br.slug,
    br.belief,
    br.room_title,
    br.search_summary,
    br.created_at,
    br.challenge_count,
    ts_rank(br.search_document, query.tsq)::real as rank
  from belief_rooms br
  cross join query
  where br.status = 'published'
    and br.is_hidden = false
    and br.search_document @@ query.tsq
  order by rank desc, br.created_at desc
  limit greatest(result_limit, 1);
$$;
