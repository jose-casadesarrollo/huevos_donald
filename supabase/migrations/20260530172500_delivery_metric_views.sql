-- Admin metric views for the delivery-scheduling dashboard.
-- security_invoker=on so the caller's RLS applies (matches existing admin_*
-- views): admins aggregate all rows, other users only their own.

-- Harden the trigger helper flagged by the security advisor (mutable search_path).
alter function public.tg_set_updated_at() set search_path = '';

-- Deliveries per day: counts by status + total egg units (production/load view).
create or replace view public.admin_deliveries_by_day with (security_invoker = on) as
select
  d.delivery_date,
  count(*)::int                                                    as total_deliveries,
  count(*) filter (where d.status = 'scheduled')::int              as scheduled,
  count(*) filter (where d.status = 'out_for_delivery')::int       as out_for_delivery,
  count(*) filter (where d.status = 'delivered')::int             as delivered,
  count(*) filter (where d.status in ('failed', 'skipped'))::int   as failed_or_skipped,
  coalesce(sum(d.quantity), 0)::int                                as total_units
from public.deliveries d
where d.delivery_date is not null
group by d.delivery_date;

-- Slot utilization per day/zone/slot: booked vs configured capacity.
create or replace view public.admin_slot_utilization with (security_invoker = on) as
select
  d.delivery_date,
  d.zone_id,
  z.name        as zone_name,
  d.slot_id,
  s.name        as slot_name,
  count(*)::int as booked,
  sc.max_orders,
  (sc.max_orders - count(*))::int as remaining
from public.deliveries d
join public.delivery_zones z on z.id = d.zone_id
join public.delivery_slots s on s.id = d.slot_id
left join public.slot_capacity sc on sc.zone_id = d.zone_id and sc.slot_id = d.slot_id
where d.delivery_date is not null
group by d.delivery_date, d.zone_id, z.name, d.slot_id, s.name, sc.max_orders;

-- Egg demand per ISO week (production forecast).
create or replace view public.admin_egg_demand_by_week with (security_invoker = on) as
select
  date_trunc('week', d.delivery_date)::date as week_start,
  coalesce(sum(d.quantity), 0)::int         as total_units,
  count(*)::int                             as delivery_count
from public.deliveries d
where d.delivery_date is not null
group by date_trunc('week', d.delivery_date);

-- Subscription mix by status (donut).
create or replace view public.admin_subscriptions_by_status with (security_invoker = on) as
select s.status, count(*)::int as count
from public.subscriptions s
group by s.status;

-- Subscriptions by plan (total + active = authorized).
create or replace view public.admin_subscriptions_by_plan with (security_invoker = on) as
select
  p.id            as plan_id,
  p.name          as plan_name,
  count(s.id)::int as total,
  count(s.id) filter (where s.status = 'authorized')::int as active
from public.plans p
left join public.subscriptions s on s.plan_id = p.id
group by p.id, p.name;

-- New subscriptions per day (growth line).
create or replace view public.admin_new_subscriptions_by_day with (security_invoker = on) as
select s.created_at::date as day, count(*)::int as count
from public.subscriptions s
group by s.created_at::date;

grant select on
  public.admin_deliveries_by_day,
  public.admin_slot_utilization,
  public.admin_egg_demand_by_week,
  public.admin_subscriptions_by_status,
  public.admin_subscriptions_by_plan,
  public.admin_new_subscriptions_by_day
to anon, authenticated;
