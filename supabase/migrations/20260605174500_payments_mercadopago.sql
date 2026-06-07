-- MercadoPago payments support: hold-first one-time orders + recurring subscriptions.
-- Additive + idempotent. Money stays as *_cents (pesos*100); MP calls convert to
-- integer CLP (round(cents/100)) in the edge client, never here.

-- 1) payment_status: hold-lifecycle labels (run separately in prod via execute_sql;
--    kept here with IF NOT EXISTS so a fresh DB reproduces the full set).
alter type public.payment_status add value if not exists 'cancelled';
alter type public.payment_status add value if not exists 'expired';

-- 2) payments: relax for hold-first (preference exists before any MP payment id,
--    auth user, or raw payload; agent/Telegram orders are guests).
alter table public.payments alter column mercadopago_payment_id drop not null;
alter table public.payments alter column user_id drop not null;
alter table public.payments alter column raw drop not null;
alter table public.payments alter column raw set default '{}'::jsonb;

-- 3) payments: MP join key + Checkout columns.
alter table public.payments add column if not exists external_reference uuid not null default gen_random_uuid();
alter table public.payments add column if not exists source text not null default 'web';
alter table public.payments add column if not exists mp_preference_id text;
alter table public.payments add column if not exists mp_init_point text;
alter table public.payments add column if not exists expires_at timestamptz;
create unique index if not exists uq_payments_external_reference on public.payments(external_reference);
create index if not exists idx_payments_status on public.payments(status);
do $$ begin
  alter table public.payments add constraint payments_source_chk
    check (source in ('web','telegram','agent','system'));
exception when duplicate_object then null; end $$;

-- 4) orders: payment hold expiry (status already has 'awaiting_payment').
alter table public.orders add column if not exists payment_expires_at timestamptz;
create index if not exists idx_orders_awaiting_payment_expiry
  on public.orders(payment_expires_at) where status = 'awaiting_payment';

-- 5) cron -> edge function HTTP (payments-cleanup reconcile).
create extension if not exists pg_net;
