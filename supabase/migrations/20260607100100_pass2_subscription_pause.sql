-- Pass 2 — Subscription pause / cancel / reactivate windows. SOP §6, §11.
--
-- subscription_status already has 'paused'/'cancelled'; this adds the window
-- columns + a daily pg_cron job that honors scheduled resumes and the max-pause
-- policy. Policy values (min-notice days, max-pause months, expiry action) live
-- in app_settings (see 20260607100600_pass2_policy_app_settings.sql) and are TBD.
--
-- NOTE (wired in code, not here): generate_upcoming_deliveries() and billing
-- must SKIP status='paused' subscriptions so a pause stops dispatches + charges.

alter table public.subscriptions
  add column if not exists paused_at      timestamptz,
  add column if not exists resume_at      timestamptz,   -- scheduled auto-resume
  add column if not exists pause_reason   text,
  add column if not exists reactivated_at timestamptz;

-- Daily maintenance: reactivate due pauses + apply the max-pause expiry policy.
create or replace function public.process_subscription_pauses() returns jsonb
language plpgsql security definer set search_path = public as $fn$
declare
  reactivated  int := 0;
  expired      int := 0;
  max_months   int;
  expiry_action text;
begin
  -- 1) Scheduled resume (customer set a resume date).
  update public.subscriptions
     set status = 'authorized', reactivated_at = now(),
         paused_at = null, resume_at = null, updated_at = now()
   where status = 'paused' and resume_at is not null and resume_at <= now();
  get diagnostics reactivated = row_count;

  -- 2) Max-pause expiry (policy-driven; no-op until configured).
  select (value #>> '{}')::int into max_months from public.app_settings where key = 'pause_max_months';
  select (value #>> '{}')     into expiry_action from public.app_settings where key = 'pause_expiry_action';

  if max_months is not null then
    if expiry_action = 'cancel' then
      update public.subscriptions
         set status = 'cancelled', cancelled_at = now(), updated_at = now()
       where status = 'paused' and paused_at is not null
         and paused_at < now() - make_interval(months => max_months);
    else  -- default: reactivate
      update public.subscriptions
         set status = 'authorized', reactivated_at = now(),
             paused_at = null, resume_at = null, updated_at = now()
       where status = 'paused' and paused_at is not null
         and paused_at < now() - make_interval(months => max_months);
    end if;
    get diagnostics expired = row_count;
  end if;

  return jsonb_build_object('reactivated', reactivated, 'expired', expired);
end $fn$;

-- Schedule daily at 09:00 (server tz). Guarded so a missing pg_cron doesn't fail the migration.
do $do$ begin
  perform cron.unschedule('process-subscription-pauses');
exception when others then null; end $do$;

do $do$ begin
  perform cron.schedule('process-subscription-pauses', '0 9 * * *',
    $cron$select public.process_subscription_pauses()$cron$);
exception when others then
  raise notice 'pg_cron unavailable — schedule public.process_subscription_pauses() manually';
end $do$;
