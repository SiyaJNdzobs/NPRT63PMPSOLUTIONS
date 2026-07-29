create or replace function update_driver_pin(p_taxi_id uuid, p_new_pin text)
returns void as $$
begin
  update taxis
  set driver_pin_hash = crypt(p_new_pin, gen_salt('bf'))
  where id = p_taxi_id;
end;
$$ language plpgsql security definer;
