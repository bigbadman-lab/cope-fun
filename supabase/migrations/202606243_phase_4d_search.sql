alter table belief_rooms
  add column if not exists room_title text,
  add column if not exists search_summary text,
  add column if not exists search_document tsvector;

create or replace function belief_rooms_set_search_document()
returns trigger
language plpgsql
as $$
begin
  new.search_document :=
    setweight(to_tsvector('english', coalesce(new.belief, '')), 'A') ||
    setweight(
      to_tsvector(
        'english',
        coalesce(nullif(trim(coalesce(new.room_title, '')), ''), new.belief, '')
      ),
      'B'
    ) ||
    setweight(to_tsvector('english', coalesce(new.search_summary, '')), 'C');

  return new;
end;
$$;

drop trigger if exists belief_rooms_search_document_trigger on belief_rooms;
create trigger belief_rooms_search_document_trigger
before insert or update of belief, room_title, search_summary
on belief_rooms
for each row
execute function belief_rooms_set_search_document();

update belief_rooms
set
  room_title = coalesce(nullif(trim(room_title), ''), belief),
  search_summary = coalesce(
    nullif(trim(search_summary), ''),
    (
      select left(string_agg(text, ' ' order by sort_order), 500)
      from belief_room_messages
      where room_id = belief_rooms.id
        and author_type = 'agent'
    )
  )
where status = 'published';

create index if not exists belief_rooms_search_document_idx
  on belief_rooms
  using gin (search_document);

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
    and br.search_document @@ query.tsq
  order by rank desc, br.created_at desc
  limit greatest(result_limit, 1);
$$;
