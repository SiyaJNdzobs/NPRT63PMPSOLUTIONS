-- Enable RLS on every table
alter table users enable row level security;
alter table ranks enable row level security;
alter table taxis enable row level security;
alter table queue_entries enable row level security;
alter table long_distance_logs enable row level security;
alter table late_trip_bookings enable row level security;
alter table reviews enable row level security;
alter table audit_log enable row level security;

-- USERS: users can read their own row; admins can read all
create policy "users_select_own_or_admin"
on users for select
using (
  auth.uid() = id
  or exists (select 1 from users u where u.id = auth.uid() and u.role = 'admin')
);

-- RANKS: anyone can read; only admins can write
create policy "ranks_select_all"
on ranks for select
using (true);

create policy "ranks_insert_admin"
on ranks for insert
with check (
  exists (select 1 from users u where u.id = auth.uid() and u.role = 'admin')
);

create policy "ranks_update_admin"
on ranks for update
using (
  exists (select 1 from users u where u.id = auth.uid() and u.role = 'admin')
);

-- TAXIS: owners manage their own; any authenticated user can read
create policy "taxis_select_all_authenticated"
on taxis for select
using (auth.role() = 'authenticated');

create policy "taxis_insert_owner"
on taxis for insert
with check (owner_id = auth.uid());

create policy "taxis_update_owner"
on taxis for update
using (owner_id = auth.uid());

-- QUEUE_ENTRIES: public read; marshals write only for their own rank
create policy "queue_select_all"
on queue_entries for select
using (true);

create policy "queue_insert_marshal_own_rank"
on queue_entries for insert
with check (
  exists (
    select 1 from users u
    join ranks r on r.marshal_id = u.id
    where u.id = auth.uid() and u.role = 'marshal' and r.id = queue_entries.rank_id
  )
);

create policy "queue_update_marshal_own_rank"
on queue_entries for update
using (
  exists (
    select 1 from users u
    join ranks r on r.marshal_id = u.id
    where u.id = auth.uid() and u.role = 'marshal' and r.id = queue_entries.rank_id
  )
);

-- LONG_DISTANCE_LOGS: only recording marshal + admins can read
create policy "manifest_select_marshal_or_admin"
on long_distance_logs for select
using (
  marshal_id = auth.uid()
  or exists (select 1 from users u where u.id = auth.uid() and u.role = 'admin')
);

create policy "manifest_insert_marshal"
on long_distance_logs for insert
with check (marshal_id = auth.uid());

-- LATE_TRIP_BOOKINGS: public read + insert (passengers aren't authenticated)
create policy "late_trip_select_all"
on late_trip_bookings for select
using (true);

create policy "late_trip_insert_all"
on late_trip_bookings for insert
with check (true);

-- REVIEWS: anyone can insert; only admins can update status/response
create policy "reviews_select_all"
on reviews for select
using (true);

create policy "reviews_insert_all"
on reviews for insert
with check (true);

create policy "reviews_update_admin"
on reviews for update
using (
  exists (select 1 from users u where u.id = auth.uid() and u.role = 'admin')
);

-- AUDIT_LOG: admin read-only; writes come only from server-side functions
create policy "audit_select_admin"
on audit_log for select
using (
  exists (select 1 from users u where u.id = auth.uid() and u.role = 'admin')
);