-- Auto-increment queue_position when a new queue entry is inserted for a rank
create or replace function set_queue_position()
returns trigger as $$
begin
  select coalesce(max(queue_position), 0) + 1
  into new.queue_position
  from queue_entries
  where rank_id = new.rank_id and status = 'waiting';
  return new;
end;
$$ language plpgsql security definer;

create trigger trg_set_queue_position
before insert on queue_entries
for each row execute function set_queue_position();

-- Nightly reset of daily trip/revenue counters on taxis
create or replace function reset_daily_taxi_stats()
returns void as $$
begin
  update taxis set total_trips_today = 0, total_revenue_today = 0;
end;
$$ language plpgsql security definer;

-- Schedule the nightly reset at 00:00 UTC using pg_cron
select cron.schedule(
  'reset-daily-taxi-stats',
  '0 0 * * *',
  $$ select reset_daily_taxi_stats(); $$
);

-- Auto-log queue joins and departures into audit_log
create or replace function log_queue_activity()
returns trigger as $$
begin
  if (tg_op = 'INSERT') then
    insert into audit_log (actor_id, action, target_table, target_id)
    values (null, 'queue_join', 'queue_entries', new.id::text);
  elsif (tg_op = 'UPDATE' and new.status = 'departed' and old.status <> 'departed') then
    insert into audit_log (actor_id, action, target_table, target_id)
    values (null, 'depart', 'queue_entries', new.id::text);
  end if;
  return new;
end;
$$ language plpgsql security definer;

create trigger trg_log_queue_activity
after insert or update on queue_entries
for each row execute function log_queue_activity();