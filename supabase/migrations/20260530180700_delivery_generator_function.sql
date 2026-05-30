-- Auto-generate upcoming deliveries for active subscriptions.
--
-- A daily, idempotent pre-generator that fills the rolling delivery schedule for
-- every ACTIVE ('authorized') subscription, honouring the zone's served weekdays,
-- the customer's preferred slot/weekday, per-(zone,slot) capacity, and blackout
-- dates. Designed + adversarially reviewed against the live schema, then proven
-- with a seed/generate/idempotency/teardown cycle.
--
-- Idempotency: cadence dates are anchored to a stable phase derived from the
-- subscription's start, so a run produces the same dates every time; the partial
-- unique index below + ON CONFLICT DO NOTHING make re-runs no-ops.
--
-- SECURITY DEFINER + search_path='' is REQUIRED: public.deliveries has RLS enabled
-- with no INSERT policy, so the function must run as the owner to insert. Every
-- public/auth object is therefore schema-qualified (pg_catalog builtins resolve
-- implicitly).

-- Idempotency backstop. The partial predicate (delivery_date IS NOT NULL) MUST
-- match the ON CONFLICT inference clause in the function exactly.
create unique index if not exists deliveries_subscription_delivery_date_uidx
  on public.deliveries (subscription_id, delivery_date)
  where delivery_date is not null;

create or replace function public.generate_upcoming_deliveries()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $func$
declare
  -- Configuration (read from public.app_settings, with safe defaults).
  v_tz            text;
  v_horizon_weeks integer;

  -- Window boundaries (dates in the business timezone).
  v_today        date;
  v_window_start date;   -- tomorrow: same-day creation is intentionally excluded
  v_window_end   date;   -- today + horizon_weeks*7, inclusive

  -- Per-subscription working variables.
  r_sub          record;
  v_zone_id      uuid;
  v_slot_id      uuid;
  v_weekday      integer;
  v_interval     integer;     -- cadence length in whole days (7 / 14 / 28)
  v_anchor_base  date;        -- (started_at|created_at) AT TIME ZONE tz, as a date
  v_anchor       date;        -- first preferred-weekday occurrence on/after anchor_base
  v_first        date;        -- first cadence date >= window_start

  -- Per-candidate-date working variables.
  v_d            date;
  v_max_orders   integer;     -- capacity cap for (zone,slot); NULL => unlimited
  v_used         integer;     -- existing non-skipped deliveries for (zone,slot,d), other subs
  v_inserted     integer;     -- rows affected by the INSERT

  -- Result counters.
  v_created             integer := 0;
  v_skipped_no_config   integer := 0;
  v_skipped_zone_day    integer := 0;
  v_skipped_blackout    integer := 0;
  v_skipped_capacity    integer := 0;
begin
  -- Serialize concurrent runs (e.g. a manual service_role call overlapping the
  -- daily cron) so the per-date capacity re-count cannot race. Released at txn end.
  perform pg_advisory_xact_lock(827301);

  -- 1. Resolve configuration. app_settings.value is jsonb; `#>> '{}'` extracts the
  --    underlying scalar TEXT (works for both a jsonb string and a jsonb number).
  --    `(value #>> '{}')::integer` is portable to PG15 (a direct jsonb->int cast
  --    only exists from PG16) and tolerates a string-typed misconfig.
  select s.value #>> '{}' into v_tz
  from public.app_settings s
  where s.key = 'timezone';
  v_tz := coalesce(v_tz, 'America/Santiago');

  select (s.value #>> '{}')::integer into v_horizon_weeks
  from public.app_settings s
  where s.key = 'schedule_horizon_weeks';
  v_horizon_weeks := coalesce(v_horizon_weeks, 4);

  -- 2. Rolling window in the business timezone. Same-day deliveries are NOT
  --    generated: the window starts tomorrow (today+1), giving a one-calendar-day
  --    lead time that complements app_settings.order_cutoff_hours.
  v_today        := (now() at time zone v_tz)::date;
  v_window_start := v_today + 1;
  v_window_end   := v_today + (v_horizon_weeks * 7);

  -- Degenerate horizon (<= 0 weeks): nothing to generate.
  if v_window_end < v_window_start then
    return jsonb_build_object(
      'created', 0, 'skipped_no_config', 0, 'skipped_zone_day', 0,
      'skipped_blackout', 0, 'skipped_capacity', 0,
      'window_start', v_window_start, 'window_end', v_window_end,
      'timezone', v_tz, 'generated_at', now()
    );
  end if;

  -- 3. Iterate every ACTIVE subscription. JOIN plans (cadence + quantity);
  --    LEFT JOIN profiles (zone fallback).
  for r_sub in
    select
      sub.id                                             as subscription_id,
      sub.user_id                                        as user_id,
      coalesce(sub.delivery_zone_id, p.delivery_zone_id) as zone_id,
      sub.preferred_slot_id                              as slot_id,
      sub.preferred_weekday                              as weekday,
      pl.frequency                                       as frequency,
      pl.quantity_per_delivery                           as quantity,
      coalesce(sub.started_at, sub.created_at)           as anchor_ts
    from public.subscriptions sub
    join public.plans pl        on pl.id = sub.plan_id
    left join public.profiles p on p.id = sub.user_id
    where sub.status = 'authorized'
  loop
    v_zone_id := r_sub.zone_id;
    v_slot_id := r_sub.slot_id;
    v_weekday := r_sub.weekday;

    -- 3a. Missing core scheduling config.
    if v_zone_id is null or v_slot_id is null or v_weekday is null then
      v_skipped_no_config := v_skipped_no_config + 1;
      continue;
    end if;

    -- 3b. Slot inactive/absent.
    if not exists (
      select 1 from public.delivery_slots ds where ds.id = v_slot_id and ds.active
    ) then
      v_skipped_no_config := v_skipped_no_config + 1;
      continue;
    end if;

    -- 3c. Zone inactive/absent.
    if not exists (
      select 1 from public.delivery_zones dz where dz.id = v_zone_id and dz.active
    ) then
      v_skipped_no_config := v_skipped_no_config + 1;
      continue;
    end if;

    -- 3d. Zone does not serve the preferred weekday.
    if not exists (
      select 1 from public.delivery_zone_days zd
      where zd.zone_id = v_zone_id and zd.weekday = v_weekday and zd.active
    ) then
      v_skipped_zone_day := v_skipped_zone_day + 1;
      continue;
    end if;

    -- 4. Cadence anchoring (deterministic across runs => idempotent dates).
    v_interval := case r_sub.frequency
                    when 'weekly'   then 7
                    when 'biweekly' then 14
                    when 'monthly'  then 28
                    else null
                  end;

    -- Defensive: an unhandled future plan_frequency becomes an observable skip.
    if v_interval is null then
      v_skipped_no_config := v_skipped_no_config + 1;
      continue;
    end if;

    v_anchor_base := (r_sub.anchor_ts at time zone v_tz)::date;

    -- First occurrence of the preferred weekday on/after anchor_base.
    v_anchor := v_anchor_base
              + ((v_weekday - extract(dow from v_anchor_base)::int + 7) % 7);

    -- Jump forward by whole intervals to the first date >= window_start.
    if v_anchor < v_window_start then
      v_first := v_anchor
               + (ceil((v_window_start - v_anchor)::numeric / v_interval)::int) * v_interval;
    else
      v_first := v_anchor;
    end if;

    -- 5/6. Walk candidate dates by cadence; per-date blackout + capacity checks.
    v_d := v_first;
    while v_d <= v_window_end loop

      -- 6a. Blackout: zone-specific OR global (zone_id IS NULL).
      if exists (
        select 1 from public.delivery_blackout_dates b
        where b.date = v_d and (b.zone_id = v_zone_id or b.zone_id is null)
      ) then
        v_skipped_blackout := v_skipped_blackout + 1;
        v_d := v_d + v_interval;
        continue;
      end if;

      -- 6b. Capacity. A slot_capacity row => finite cap; none => UNLIMITED.
      select sc.max_orders into v_max_orders
      from public.slot_capacity sc
      where sc.zone_id = v_zone_id and sc.slot_id = v_slot_id;

      if v_max_orders is not null then
        -- Count existing non-skipped deliveries for this (zone,slot,date), excluding
        -- this subscription's own row. Re-reads each iteration so rows inserted
        -- earlier in this same run are visible and the cap cannot be overflowed.
        select count(*) into v_used
        from public.deliveries dlv
        where dlv.zone_id = v_zone_id
          and dlv.slot_id = v_slot_id
          and dlv.delivery_date = v_d
          and dlv.status <> 'skipped'
          and dlv.subscription_id <> r_sub.subscription_id;

        if v_used >= v_max_orders then
          v_skipped_capacity := v_skipped_capacity + 1;
          v_d := v_d + v_interval;
          continue;
        end if;
      end if;

      -- 6c. Insert. Set BOTH scheduled_for and delivery_date = v_d.
      insert into public.deliveries
        (subscription_id, user_id, scheduled_for, delivery_date,
         slot_id, zone_id, quantity, status)
      values
        (r_sub.subscription_id, r_sub.user_id, v_d, v_d,
         v_slot_id, v_zone_id, r_sub.quantity, 'scheduled')
      on conflict (subscription_id, delivery_date) where delivery_date is not null
      do nothing;

      get diagnostics v_inserted = row_count;
      v_created := v_created + v_inserted;

      v_d := v_d + v_interval;
    end loop;

  end loop;

  -- 8. Run summary.
  return jsonb_build_object(
    'created',             v_created,
    'skipped_no_config',   v_skipped_no_config,
    'skipped_zone_day',    v_skipped_zone_day,
    'skipped_blackout',    v_skipped_blackout,
    'skipped_capacity',    v_skipped_capacity,
    'window_start',        v_window_start,
    'window_end',          v_window_end,
    'timezone',            v_tz,
    'generated_at',        now()
  );
end;
$func$;
