-- Pass 2 — Incidents (damaged product) + resolution + coupons. SOP §18–20.
--
-- Customers report damaged/missing product within 24h with photo evidence;
-- resolution is replacement or coupon — never cash (SOP §19). Cash refunds are
-- reserved for cancellation-with-prepaid-saldo (handled via egg_ledger/payments).

do $do$ begin
  if not exists (select 1 from pg_type where typname = 'incident_type') then
    create type public.incident_type as enum ('damaged_product', 'missing_items', 'wrong_items', 'other');
  end if;
  if not exists (select 1 from pg_type where typname = 'incident_status') then
    create type public.incident_status as enum ('open', 'reviewing', 'resolved', 'rejected');
  end if;
  if not exists (select 1 from pg_type where typname = 'incident_resolution') then
    create type public.incident_resolution as enum ('partial_replacement', 'full_replacement', 'coupon', 'none');
  end if;
  if not exists (select 1 from pg_type where typname = 'coupon_type') then
    create type public.coupon_type as enum ('percent', 'fixed', 'eggs');
  end if;
  if not exists (select 1 from pg_type where typname = 'coupon_status') then
    create type public.coupon_status as enum ('active', 'redeemed', 'expired', 'void');
  end if;
end $do$;

-- ── Incidents ──────────────────────────────────────────────────────────────
create table if not exists public.incidents (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.profiles(id) on delete cascade,
  delivery_id   uuid references public.deliveries(id) on delete set null,
  order_id      uuid references public.orders(id) on delete set null,
  type          public.incident_type not null default 'damaged_product',
  description   text,
  reported_at   timestamptz not null default now(),
  within_window boolean,                       -- reported within 24h of delivery (SOP §18)
  status        public.incident_status not null default 'open',
  resolution    public.incident_resolution,
  resolved_at   timestamptz,
  resolved_by   uuid references public.profiles(id) on delete set null,
  note          text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index if not exists incidents_user_idx on public.incidents (user_id, created_at desc);

create table if not exists public.incident_photos (
  id           uuid primary key default gen_random_uuid(),
  incident_id  uuid not null references public.incidents(id) on delete cascade,
  storage_path text not null,                   -- path in the 'incident-evidence' bucket
  created_at   timestamptz not null default now()
);

-- ── Coupons ────────────────────────────────────────────────────────────────
create table if not exists public.coupons (
  id              uuid primary key default gen_random_uuid(),
  code            text not null unique,
  user_id         uuid references public.profiles(id) on delete cascade,   -- null = general
  type            public.coupon_type not null,
  value           integer not null,             -- percent (1-100) | fixed cents | eggs
  currency        text not null default 'CLP',
  reason          text,                          -- incident_resolution | promo | refund_alt
  incident_id     uuid references public.incidents(id) on delete set null,
  max_redemptions integer not null default 1,
  redeemed_count  integer not null default 0,
  valid_from      timestamptz not null default now(),
  valid_until     timestamptz,
  status          public.coupon_status not null default 'active',
  created_at      timestamptz not null default now()
);
create index if not exists coupons_user_idx on public.coupons (user_id);

create table if not exists public.coupon_redemptions (
  id           uuid primary key default gen_random_uuid(),
  coupon_id    uuid not null references public.coupons(id) on delete cascade,
  user_id      uuid references public.profiles(id) on delete set null,
  order_id     uuid references public.orders(id) on delete set null,
  amount_cents integer,
  redeemed_at  timestamptz not null default now()
);

-- ── RLS ────────────────────────────────────────────────────────────────────
alter table public.incidents          enable row level security;
alter table public.incident_photos    enable row level security;
alter table public.coupons            enable row level security;
alter table public.coupon_redemptions enable row level security;

-- Customers may file + read their own incidents; admins manage all.
drop policy if exists incidents_select_own on public.incidents;
create policy incidents_select_own on public.incidents for select to authenticated
  using (user_id = auth.uid() or public.is_admin());
drop policy if exists incidents_insert_own on public.incidents;
create policy incidents_insert_own on public.incidents for insert to authenticated
  with check (user_id = auth.uid());
drop policy if exists incidents_admin_all on public.incidents;
create policy incidents_admin_all on public.incidents for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists incident_photos_select on public.incident_photos;
create policy incident_photos_select on public.incident_photos for select to authenticated
  using (exists (select 1 from public.incidents i
                 where i.id = incident_id and (i.user_id = auth.uid() or public.is_admin())));
drop policy if exists incident_photos_insert on public.incident_photos;
create policy incident_photos_insert on public.incident_photos for insert to authenticated
  with check (exists (select 1 from public.incidents i
                      where i.id = incident_id and i.user_id = auth.uid()));

drop policy if exists coupons_select_own on public.coupons;
create policy coupons_select_own on public.coupons for select to authenticated
  using (user_id = auth.uid() or public.is_admin());
drop policy if exists coupons_admin_all on public.coupons;
create policy coupons_admin_all on public.coupons for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists coupon_redemptions_select_own on public.coupon_redemptions;
create policy coupon_redemptions_select_own on public.coupon_redemptions for select to authenticated
  using (user_id = auth.uid() or public.is_admin());

grant select, insert on public.incidents          to authenticated;
grant select, insert on public.incident_photos    to authenticated;
grant select        on public.coupons             to authenticated;
grant select        on public.coupon_redemptions  to authenticated;

-- ── Photo evidence storage (private bucket; per-user folder) ───────────────
insert into storage.buckets (id, name, public)
  values ('incident-evidence', 'incident-evidence', false)
  on conflict (id) do nothing;

drop policy if exists "incident_evidence_read_own"  on storage.objects;
create policy "incident_evidence_read_own" on storage.objects for select to authenticated
  using (bucket_id = 'incident-evidence' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "incident_evidence_write_own" on storage.objects;
create policy "incident_evidence_write_own" on storage.objects for insert to authenticated
  with check (bucket_id = 'incident-evidence' and (storage.foldername(name))[1] = auth.uid()::text);
