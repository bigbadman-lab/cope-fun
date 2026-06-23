create extension if not exists pgcrypto;

do $$ begin
  create type room_status as enum ('published', 'hidden', 'deleted');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type room_message_author_type as enum ('creator', 'engine', 'agent');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type agent_slug as enum ('mason', 'victor', 'logan', 'theo');
exception when duplicate_object then null;
end $$;

create table if not exists anonymous_sessions (
  id uuid primary key default gen_random_uuid(),
  session_token_hash text not null unique,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);

create table if not exists belief_rooms (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  belief text not null check (char_length(trim(belief)) > 0),
  normalized_belief text,
  status room_status not null default 'published',
  creator_anonymous_session_id uuid not null references anonymous_sessions(id) on delete restrict,
  attention_remaining integer not null default 5 check (attention_remaining >= 0),
  max_attention integer not null default 5 check (max_attention >= 0),
  challenge_count integer not null default 0 check (challenge_count >= 0),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint belief_rooms_attention_bounds check (attention_remaining <= max_attention)
);

create table if not exists belief_room_messages (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references belief_rooms(id) on delete cascade,
  client_message_id text,
  sort_order integer not null check (sort_order >= 0),
  author_type room_message_author_type not null,
  author_name text not null check (char_length(trim(author_name)) > 0),
  agent_slug agent_slug null,
  text text not null check (char_length(trim(text)) > 0),
  is_user boolean not null default false,
  is_attention_challenge boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint belief_room_messages_room_order_unique unique (room_id, sort_order),
  constraint belief_room_messages_agent_consistency check (
    (author_type = 'agent' and agent_slug is not null)
    or (author_type <> 'agent' and agent_slug is null)
  )
);

create unique index if not exists belief_room_messages_client_id_unique
  on belief_room_messages(room_id, client_message_id)
  where client_message_id is not null;

create index if not exists belief_rooms_status_created_at_idx
  on belief_rooms(status, created_at desc);

create index if not exists belief_rooms_creator_anonymous_session_id_idx
  on belief_rooms(creator_anonymous_session_id);

create index if not exists belief_room_messages_room_order_idx
  on belief_room_messages(room_id, sort_order);

alter table anonymous_sessions enable row level security;
alter table belief_rooms enable row level security;
alter table belief_room_messages enable row level security;

drop policy if exists "Public can read published rooms" on belief_rooms;
create policy "Public can read published rooms"
  on belief_rooms
  for select
  using (status = 'published');

drop policy if exists "Public can read messages for published rooms" on belief_room_messages;
create policy "Public can read messages for published rooms"
  on belief_room_messages
  for select
  using (
    exists (
      select 1
      from belief_rooms
      where belief_rooms.id = belief_room_messages.room_id
        and belief_rooms.status = 'published'
    )
  );
