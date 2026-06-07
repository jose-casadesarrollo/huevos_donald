-- Pass 2 — Account balances: Saldo de huevos + Puntos Donald. SOP §8–10, §20.
--
-- Append-only ledgers (immutable rows); balance = sum(delta). A cached balance
-- column is kept in sync by an AFTER INSERT trigger for fast reads on /account
-- and from the agent. Writes are SERVICE-ROLE ONLY (the Edge agent); customers
-- read their own rows, admins read all.

-- ── Ledger reason enums ────────────────────────────────────────────────────
do $do$ begin
  if not exists (select 1 from pg_type where typname = 'egg_ledger_reason') then
    create type public.egg_ledger_reason as enum
      ('plan_credit', 'delivery_debit', 'refund', 'adjustment', 'incident_credit');
  end if;
  if not exists (select 1 from pg_type where typname = 'points_ledger_reason') then
    create type public.points_ledger_reason as enum
      ('purchase', 'renewal', 'redemption', 'expiration', 'adjustment');
  end if;
end $do$;

-- ── Saldo de huevos ledger ─────────────────────────────────────────────────
create table if not exists public.egg_ledger (
  id                   uuid primary key default gen_random_uuid(),
  user_id              uuid not null references public.profiles(id) on delete cascade,
  subscription_id      uuid references public.subscriptions(id) on delete set null,
  delta                integer not null,                 -- +credit / −debit, in eggs
  reason               public.egg_ledger_reason not null,
  value_cents_per_unit integer,                           -- $ paid per egg, for SOP §20 proportional refunds
  delivery_id          uuid references public.deliveries(id) on delete set null,
  order_id             uuid references public.orders(id) on delete set null,
  payment_id           uuid references public.payments(id) on delete set null,
  note                 text,
  created_at           timestamptz not null default now()
);
create index if not exists egg_ledger_user_idx on public.egg_ledger (user_id, created_at desc);
create index if not exists egg_ledger_sub_idx  on public.egg_ledger (subscription_id);

-- ── Puntos Donald ledger ───────────────────────────────────────────────────
create table if not exists public.points_ledger (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references public.profiles(id) on delete cascade,
  subscription_id uuid references public.subscriptions(id) on delete set null,
  delta           integer not null,                       -- +earn / −redeem / −expire
  reason          public.points_ledger_reason not null,
  order_id        uuid references public.orders(id) on delete set null,
  payment_id      uuid references public.payments(id) on delete set null,
  note            text,
  created_at      timestamptz not null default now()
);
create index if not exists points_ledger_user_idx on public.points_ledger (user_id, created_at desc);

-- ── Cached balances (read model; kept in sync by trigger) ──────────────────
alter table public.subscriptions add column if not exists egg_balance integer not null default 0;
alter table public.profiles      add column if not exists points_balance integer not null default 0;

-- Ledgers are append-only, so an incremental += delta keeps the cache exact.
create or replace function public.sync_egg_balance() returns trigger
language plpgsql security definer set search_path = public as $fn$
begin
  if new.subscription_id is not null then
    update public.subscriptions
       set egg_balance = egg_balance + new.delta, updated_at = now()
     where id = new.subscription_id;
  end if;
  return new;
end $fn$;

create or replace function public.sync_points_balance() returns trigger
language plpgsql security definer set search_path = public as $fn$
begin
  update public.profiles
     set points_balance = points_balance + new.delta, updated_at = now()
   where id = new.user_id;
  return new;
end $fn$;

drop trigger if exists egg_ledger_sync on public.egg_ledger;
create trigger egg_ledger_sync after insert on public.egg_ledger
  for each row execute function public.sync_egg_balance();

drop trigger if exists points_ledger_sync on public.points_ledger;
create trigger points_ledger_sync after insert on public.points_ledger
  for each row execute function public.sync_points_balance();

-- ── RLS: customers read their own ledger; admins read all; writes via service role ──
alter table public.egg_ledger    enable row level security;
alter table public.points_ledger enable row level security;

drop policy if exists egg_ledger_select_own on public.egg_ledger;
create policy egg_ledger_select_own on public.egg_ledger for select to authenticated
  using (user_id = auth.uid() or public.is_admin());

drop policy if exists points_ledger_select_own on public.points_ledger;
create policy points_ledger_select_own on public.points_ledger for select to authenticated
  using (user_id = auth.uid() or public.is_admin());

grant select on public.egg_ledger    to authenticated;
grant select on public.points_ledger to authenticated;
