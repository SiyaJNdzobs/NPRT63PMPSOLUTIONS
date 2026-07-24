create extension if not exists "pgcrypto";

create table users (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  cell_number text unique not null check (cell_number ~ '^0[6-8][0-9]{8}$'),
  email text,
  role text not null check (role in ('owner','marshal','admin')),
  created_at timestamptz default now()
);

create table ranks (
  id uuid primary key default gen_random_uuid(),
  rank_name text unique not null,
  city text not null,
  province text not null,
  routes_served text[] not null default '{}',
  marshal_id uuid references users(id),
  created_at timestamptz default now()
);

create table taxis (
  id uuid primary key default gen_random_uuid(),
  registration_number text unique not null,
  owner_id uuid references users(id) on delete cascade,
  driver_name text not null,
  driver_cell text unique not null check (driver_cell ~ '^0[6-8][0-9]{8}$'),
  driver_pin_hash text,
  rank_id uuid references ranks(id),
  total_trips_today integer default 0,
  total_revenue_today numeric default 0,
  created_at timestamptz default now()
);

create table queue_entries (
  id uuid primary key default gen_random_uuid(),
  rank_id uuid references ranks(id),
  taxi_id uuid references taxis(id),
  driver_cell text,
  scan_timestamp timestamptz default now(),
  queue_position integer,
  status text default 'waiting' check (status in ('waiting','loading','departed'))
);

create table long_distance_logs (
  id uuid primary key default gen_random_uuid(),
  marshal_id uuid references users(id),
  taxi_id uuid references taxis(id),
  passenger_name text not null,
  passenger_surname text not null,
  contact_number text,
  next_of_kin_name text,
  next_of_kin_contact text,
  created_at timestamptz default now()
);

create table late_trip_bookings (
  id uuid primary key default gen_random_uuid(),
  rank_id uuid references ranks(id),
  destination text not null,
  passenger_cells text[] default '{}',
  base_fare numeric,
  premium_fare numeric,
  is_confirmed boolean default false,
  scheduled_time timestamptz
);

create table reviews (
  id uuid primary key default gen_random_uuid(),
  author_role text check (author_role in ('owner','marshal','driver','passenger')),
  author_ref uuid references users(id),
  rank_id uuid references ranks(id),
  category text check (category in ('queue_fairness','safety','app_usability','driver_conduct','other')),
  rating integer check (rating between 1 and 5),
  comment text,
  status text default 'new' check (status in ('new','acknowledged','resolved')),
  admin_response text,
  created_at timestamptz default now(),
  resolved_at timestamptz
);

create table audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references users(id),
  action text not null,
  target_table text,
  target_id text,
  ip_hash text,
  created_at timestamptz default now()
);