-- Daily auto-generation of upcoming deliveries via pg_cron.

-- Install pg_cron (creates schema "cron"). Idempotent.
create extension if not exists pg_cron;

-- Lock down execution: generate_upcoming_deliveries() bypasses RLS
-- (SECURITY DEFINER), so only trusted roles may call it. pg_cron jobs run as the
-- database superuser (postgres), which is unaffected by these REVOKEs.
revoke execute on function public.generate_upcoming_deliveries() from public;
revoke execute on function public.generate_upcoming_deliveries() from anon;
revoke execute on function public.generate_upcoming_deliveries() from authenticated;
grant  execute on function public.generate_upcoming_deliveries() to service_role;

-- Idempotent scheduling under a stable jobname: drop any prior job, then (re)create.
do $cron$
declare
  v_jobname text := 'generate-upcoming-deliveries';
begin
  if exists (select 1 from cron.job where jobname = v_jobname) then
    perform cron.unschedule(v_jobname);
  end if;

  -- Server timezone is UTC; pg_cron schedules are interpreted in UTC. 08:00 UTC
  -- daily == 04:00 (CLT, UTC-4) / 05:00 (CLST, UTC-3) in Chile -- early morning,
  -- before delivery operations. DST shifts the local run time by an hour, which
  -- is harmless: the generator is idempotent and only fills FUTURE dates.
  perform cron.schedule(
    v_jobname,
    '0 8 * * *',
    $$ select public.generate_upcoming_deliveries(); $$
  );
end;
$cron$;
