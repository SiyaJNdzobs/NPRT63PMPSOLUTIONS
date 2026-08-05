-- Allow drivers (who use PIN authentication without Supabase Auth session) to insert and update queue entries
create policy "queue_insert_public"
on queue_entries for insert
with check (true);

create policy "queue_update_public"
on queue_entries for update
using (true);

-- Allow public manifest insertion for long distance logs
create policy "manifest_insert_public"
on long_distance_logs for insert
with check (true);
