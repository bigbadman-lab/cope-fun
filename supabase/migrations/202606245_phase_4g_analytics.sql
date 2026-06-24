create table if not exists analytics_events (
  id uuid primary key default gen_random_uuid(),
  event_name text not null check (char_length(trim(event_name)) > 0),
  anonymous_session_id uuid null references anonymous_sessions(id) on delete set null,
  room_id uuid null references belief_rooms(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists analytics_events_event_name_idx
  on analytics_events (event_name);

create index if not exists analytics_events_created_at_idx
  on analytics_events (created_at desc);

create index if not exists analytics_events_room_id_idx
  on analytics_events (room_id)
  where room_id is not null;

alter table analytics_events enable row level security;
