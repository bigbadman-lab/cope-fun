create table if not exists rate_limit_counters (
  bucket_key text not null,
  window_start timestamptz not null,
  request_count integer not null default 1 check (request_count >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (bucket_key, window_start)
);

create index if not exists rate_limit_counters_updated_at_idx
  on rate_limit_counters (updated_at);

alter table rate_limit_counters enable row level security;

create or replace function increment_rate_limit_counter(
  p_bucket_key text,
  p_window_seconds integer,
  p_max_requests integer
)
returns table (allowed boolean, current_count integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_window_start timestamptz;
  v_count integer;
begin
  if p_window_seconds <= 0 or p_max_requests <= 0 then
    allowed := true;
    current_count := 0;
    return next;
  end if;

  v_window_start := to_timestamp(
    floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds
  );

  insert into rate_limit_counters as c (bucket_key, window_start, request_count)
  values (p_bucket_key, v_window_start, 1)
  on conflict (bucket_key, window_start)
  do update set
    request_count = rate_limit_counters.request_count + 1,
    updated_at = now()
  returning rate_limit_counters.request_count into v_count;

  allowed := v_count <= p_max_requests;
  current_count := v_count;
  return next;
end;
$$;
