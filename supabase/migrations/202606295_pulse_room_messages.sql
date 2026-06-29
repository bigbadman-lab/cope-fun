create table if not exists pulse_room_messages (
  id uuid primary key default gen_random_uuid(),
  belief_room_id uuid not null references belief_rooms(id) on delete cascade,
  user_id uuid references app_users(id) on delete set null,
  display_label text,
  wallet_address text,
  body text not null,
  created_at timestamptz not null default now(),
  constraint pulse_room_messages_body_length check (
    char_length(trim(body)) between 1 and 280
  )
);

create index if not exists pulse_room_messages_belief_room_created_at_idx
  on pulse_room_messages (belief_room_id, created_at asc);

alter table pulse_room_messages enable row level security;

drop policy if exists "Public can read pulse room messages" on pulse_room_messages;
create policy "Public can read pulse room messages"
  on pulse_room_messages
  for select
  using (
    exists (
      select 1
      from belief_rooms
      where belief_rooms.id = pulse_room_messages.belief_room_id
        and belief_rooms.status = 'published'
    )
  );
