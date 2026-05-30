-- Delivery scheduling foundation for the egg-subscription flow.
--
-- Decisions (aligned with product):
--   * Hybrid days  : a zone defines which weekdays it's served; the customer
--                    picks a preferred weekday among those.
--   * One record   : each `deliveries` row IS the order (no separate orders table).
--   * Global slots : one shared set of delivery time blocks, reused everywhere.
--
-- Weekday convention: 0 = Sunday … 6 = Saturday (matches Postgres `extract(dow)`).
--
-- RLS: active config is world-readable so the booking UI can show options;
-- all writes (and the internal capacity/settings tables) are admin-only via
-- the existing public.is_admin() helper.

begin;

-- --------------------------------------------------------------------------
-- updated_at trigger helper
-- --------------------------------------------------------------------------
create or replace function public.tg_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- --------------------------------------------------------------------------
-- Config / reference tables (admin-editable)
-- --------------------------------------------------------------------------

-- Global delivery time blocks (e.g. "Mañana" 09:00–13:00).
create table if not exists public.delivery_slots (
  id          uuid primary key default gen_random_uuid(),
  name        text        not null,
  start_time  time        not null,
  end_time    time        not null,
  active      boolean     not null default true,
  sort_order  integer     not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint delivery_slots_time_order check (end_time > start_time)
);

-- Geographic delivery zones (comunas / sectores).
create table if not exists public.delivery_zones (
  id          uuid primary key default gen_random_uuid(),
  name        text        not null,
  comuna      text,
  active      boolean     not null default true,
  notes       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Which weekdays each zone is served (the menu the customer picks from).
create table if not exists public.delivery_zone_days (
  id          uuid primary key default gen_random_uuid(),
  zone_id     uuid not null references public.delivery_zones (id) on delete cascade,
  weekday     smallint not null check (weekday between 0 and 6),
  active      boolean  not null default true,
  created_at  timestamptz not null default now(),
  unique (zone_id, weekday)
);

-- Max orders per (zone, slot) on a given day — drives capacity / routing.
create table if not exists public.slot_capacity (
  id          uuid primary key default gen_random_uuid(),
  zone_id     uuid not null references public.delivery_zones (id) on delete cascade,
  slot_id     uuid not null references public.delivery_slots (id) on delete cascade,
  max_orders  integer not null check (max_orders >= 0),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (zone_id, slot_id)
);

-- Days we do NOT deliver (holidays, etc.). NULL zone = applies to all zones.
create table if not exists public.delivery_blackout_dates (
  id          uuid primary key default gen_random_uuid(),
  date        date not null,
  zone_id     uuid references public.delivery_zones (id) on delete cascade,
  reason      text,
  created_at  timestamptz not null default now(),
  unique (date, zone_id)
);

-- Global tunables, editable from the DB without code changes.
create table if not exists public.app_settings (
  key         text primary key,
  value       jsonb not null,
  description text,
  updated_at  timestamptz not null default now()
);

-- --------------------------------------------------------------------------
-- Extend transactional tables (delivery = order)
-- --------------------------------------------------------------------------

alter table public.subscriptions
  add column if not exists delivery_zone_id  uuid references public.delivery_zones (id) on delete restrict,
  add column if not exists preferred_slot_id uuid references public.delivery_slots (id) on delete restrict,
  add column if not exists preferred_weekday smallint check (preferred_weekday between 0 and 6);

alter table public.deliveries
  add column if not exists delivery_date date,
  add column if not exists slot_id       uuid references public.delivery_slots (id) on delete restrict,
  add column if not exists zone_id       uuid references public.delivery_zones (id) on delete restrict,
  add column if not exists quantity      integer check (quantity is null or quantity >= 0),
  add column if not exists locked        boolean not null default false;

alter table public.profiles
  add column if not exists delivery_zone_id uuid references public.delivery_zones (id) on delete set null;

-- --------------------------------------------------------------------------
-- Indexes for the hot scheduling/forecast queries
-- --------------------------------------------------------------------------
create index if not exists idx_deliveries_delivery_date on public.deliveries (delivery_date);
create index if not exists idx_deliveries_zone_date_slot on public.deliveries (zone_id, delivery_date, slot_id);
create index if not exists idx_zone_days_zone on public.delivery_zone_days (zone_id);
create index if not exists idx_subscriptions_zone on public.subscriptions (delivery_zone_id);
create index if not exists idx_blackout_date on public.delivery_blackout_dates (date);

-- --------------------------------------------------------------------------
-- updated_at triggers on new tables
-- --------------------------------------------------------------------------
create trigger set_updated_at before update on public.delivery_slots
  for each row execute function public.tg_set_updated_at();
create trigger set_updated_at before update on public.delivery_zones
  for each row execute function public.tg_set_updated_at();
create trigger set_updated_at before update on public.slot_capacity
  for each row execute function public.tg_set_updated_at();
create trigger set_updated_at before update on public.app_settings
  for each row execute function public.tg_set_updated_at();

-- --------------------------------------------------------------------------
-- RLS
-- --------------------------------------------------------------------------
alter table public.delivery_slots          enable row level security;
alter table public.delivery_zones          enable row level security;
alter table public.delivery_zone_days       enable row level security;
alter table public.slot_capacity           enable row level security;
alter table public.delivery_blackout_dates  enable row level security;
alter table public.app_settings            enable row level security;

-- Public (booking UI) can read active options; admins manage everything.
create policy "read active slots"   on public.delivery_slots
  for select using (active or public.is_admin());
create policy "admin write slots"   on public.delivery_slots
  for all using (public.is_admin()) with check (public.is_admin());

create policy "read active zones"   on public.delivery_zones
  for select using (active or public.is_admin());
create policy "admin write zones"   on public.delivery_zones
  for all using (public.is_admin()) with check (public.is_admin());

create policy "read active zone_days" on public.delivery_zone_days
  for select using (active or public.is_admin());
create policy "admin write zone_days" on public.delivery_zone_days
  for all using (public.is_admin()) with check (public.is_admin());

create policy "read blackout dates" on public.delivery_blackout_dates
  for select using (true);
create policy "admin write blackout" on public.delivery_blackout_dates
  for all using (public.is_admin()) with check (public.is_admin());

-- Capacity + settings are internal: admin-only read and write.
create policy "admin all capacity" on public.slot_capacity
  for all using (public.is_admin()) with check (public.is_admin());
create policy "admin all settings" on public.app_settings
  for all using (public.is_admin()) with check (public.is_admin());

-- --------------------------------------------------------------------------
-- Seed defaults (so the system is usable immediately)
-- --------------------------------------------------------------------------
insert into public.delivery_slots (name, start_time, end_time, sort_order)
values
  ('Mañana', '09:00', '13:00', 1),
  ('Tarde',  '14:00', '18:00', 2)
on conflict do nothing;

insert into public.app_settings (key, value, description) values
  ('schedule_horizon_weeks', '4',                     'How many weeks ahead to pre-generate deliveries.'),
  ('order_cutoff_hours',     '24',                    'Hours before a slot when an order locks (no more changes).'),
  ('timezone',               '"America/Santiago"',    'Operating timezone for day/slot math.')
on conflict (key) do nothing;

commit;
