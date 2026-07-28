create table if not exists login_attempts (
  id uuid primary key default gen_random_uuid(),
  cell_number text not null,
  attempted_at timestamptz default now(),
  success boolean default false
);

alter table login_attempts enable row level security;

create policy "login_attempts_insert_all"
on login_attempts for insert
with check (true);

create or replace function check_login_rate_limit(p_cell text)
returns boolean as $$
declare
  recent_failures integer;
begin
  select count(*) into recent_failures
  from login_attempts
  where cell_number = p_cell
    and success = false
    and attempted_at > now() - interval '15 minutes';

  return recent_failures < 5;
end;
$$ language plpgsql security definer;
