create or replace function hash_pin(plain_pin text)
returns text as $$
  select crypt(plain_pin, gen_salt('bf'));
$$ language sql security definer;

create or replace function verify_pin(plain_pin text, stored_hash text)
returns boolean as $$
  select stored_hash = crypt(plain_pin, stored_hash);
$$ language sql security definer;
