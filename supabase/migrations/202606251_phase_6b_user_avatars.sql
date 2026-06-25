-- Phase 6B: Signed-in user avatar customization.

alter table app_users
  add column if not exists avatar_color text,
  add column if not exists avatar_url text,
  add column if not exists avatar_updated_at timestamptz;

comment on column app_users.avatar_color is
  'Preset avatar colour id: orange, ember, violet, blue, green, graphite';
comment on column app_users.avatar_url is
  'Storage object path within user-avatars bucket, e.g. {user_id}/avatar.webp';

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'user-avatars',
  'user-avatars',
  true,
  2097152,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "Public read user avatars"
  on storage.objects
  for select
  using (bucket_id = 'user-avatars');
