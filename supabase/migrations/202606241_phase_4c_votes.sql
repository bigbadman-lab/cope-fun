create table if not exists belief_room_votes (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references belief_rooms(id) on delete cascade,
  anonymous_session_id uuid not null references anonymous_sessions(id) on delete cascade,
  vote_type text not null check (vote_type in ('believe', 'cope')),
  created_at timestamptz not null default now(),
  constraint belief_room_votes_room_session_unique unique (room_id, anonymous_session_id)
);

create index if not exists belief_room_votes_room_id_idx
  on belief_room_votes(room_id);

create index if not exists belief_room_votes_anonymous_session_id_idx
  on belief_room_votes(anonymous_session_id);

alter table belief_room_votes enable row level security;

drop policy if exists "Public can read room votes" on belief_room_votes;
create policy "Public can read room votes"
  on belief_room_votes
  for select
  using (true);
