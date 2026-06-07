-- Pass 2 — Per-stage delivery timestamps + canonical 6-state label + customer
-- notification records. SOP §14–15. (Runs after the enum-extend migration so the
-- new delivery_status values are committed and usable here.)

-- ── Per-stage timestamps (for the tracker + notification triggers) ─────────
alter table public.deliveries
  add column if not exists prepared_at         timestamptz,
  add column if not exists ready_at            timestamptz,
  add column if not exists out_for_delivery_at timestamptz;

-- ── Canonical SOP label for a delivery's current state ─────────────────────
-- "Pedido recibido" / "Pago confirmado" precede a delivery row (order/payment
-- side); a delivery exists from "Pago confirmado" onward.
create or replace function public.delivery_customer_state(p_delivery_id uuid)
returns text language sql stable security invoker set search_path = public as $fn$
  select case d.status
    when 'delivered'          then 'Entregado'
    when 'out_for_delivery'   then 'En camino'
    when 'ready_for_dispatch' then 'Listo para despacho'
    when 'preparing'          then 'En preparación'
    when 'scheduled'          then 'Pago confirmado'
    else 'Pedido recibido'
  end
  from public.deliveries d
  where d.id = p_delivery_id;
$fn$;

-- ── Notification events ────────────────────────────────────────────────────
do $do$ begin
  if not exists (select 1 from pg_type where typname = 'notification_event_type') then
    create type public.notification_event_type as enum
      ('payment_confirmed', 'preparing', 'out_for_delivery', 'eta_20m', 'eta_5m', 'delivered');
  end if;
  if not exists (select 1 from pg_type where typname = 'notification_status') then
    create type public.notification_status as enum ('pending', 'sent', 'failed', 'skipped');
  end if;
end $do$;

create table if not exists public.notification_events (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid references public.profiles(id) on delete cascade,
  delivery_id   uuid references public.deliveries(id) on delete cascade,
  order_id      uuid references public.orders(id) on delete cascade,
  event_type    public.notification_event_type not null,
  channel       text not null default 'whatsapp',
  status        public.notification_status not null default 'pending',
  payload       jsonb not null default '{}'::jsonb,
  scheduled_for timestamptz,
  sent_at       timestamptz,
  created_at    timestamptz not null default now()
);
create index if not exists notification_events_user_idx    on public.notification_events (user_id, created_at desc);
create index if not exists notification_events_pending_idx on public.notification_events (status) where status = 'pending';

-- ⚠️ eta_20m / eta_5m need live driver/route data we don't have yet — the rows
-- are representable but their dispatch is deferred. The status-driven events
-- (payment_confirmed, preparing, out_for_delivery, delivered) are emitted from
-- delivery/payment state changes (wired in code).

alter table public.notification_events enable row level security;

drop policy if exists notif_select_own on public.notification_events;
create policy notif_select_own on public.notification_events for select to authenticated
  using (user_id = auth.uid() or public.is_admin());

grant select on public.notification_events to authenticated;
