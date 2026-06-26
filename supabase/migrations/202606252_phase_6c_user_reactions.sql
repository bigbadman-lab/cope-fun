-- Phase 6C: Signed-in user reactions on belief room messages.

alter table belief_room_message_reactions
  add column if not exists user_id uuid references app_users(id) on delete cascade;

alter table belief_room_message_reactions
  alter column anonymous_session_id drop not null;

create unique index if not exists belief_room_message_reactions_user_message_unique
  on belief_room_message_reactions (message_id, user_id)
  where user_id is not null;

create index if not exists belief_room_message_reactions_user_id_idx
  on belief_room_message_reactions (user_id)
  where user_id is not null;
