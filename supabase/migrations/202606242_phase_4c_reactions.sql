create table if not exists belief_room_message_reactions (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references belief_rooms(id) on delete cascade,
  message_id uuid not null references belief_room_messages(id) on delete cascade,
  anonymous_session_id uuid not null references anonymous_sessions(id) on delete cascade,
  reaction text not null check (reaction in ('smart', 'convincing', 'not_sure', 'cope')),
  created_at timestamptz not null default now(),
  constraint belief_room_message_reactions_session_message_unique
    unique (message_id, anonymous_session_id)
);

create index if not exists belief_room_message_reactions_room_id_idx
  on belief_room_message_reactions(room_id);

create index if not exists belief_room_message_reactions_message_id_idx
  on belief_room_message_reactions(message_id);

create index if not exists belief_room_message_reactions_anonymous_session_id_idx
  on belief_room_message_reactions(anonymous_session_id);

alter table belief_room_message_reactions enable row level security;

drop policy if exists "Public can read message reactions" on belief_room_message_reactions;
create policy "Public can read message reactions"
  on belief_room_message_reactions
  for select
  using (true);
