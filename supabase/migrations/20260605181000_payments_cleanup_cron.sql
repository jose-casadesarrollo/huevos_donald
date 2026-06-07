-- Minute cron that reconciles expired MercadoPago holds via the payments-cleanup
-- edge function. The bearer secret is read from Vault at runtime (NOT stored in
-- this file or the job command) — create it once with:
--   select vault.create_secret('<CLEANUP_SECRET>', 'cleanup_secret', 'payments-cleanup bearer');
-- and set the same value as the function secret CLEANUP_SECRET.
--
-- Apply this AFTER the payments-cleanup function is deployed and the vault secret
-- exists, so the first run can authenticate.

create extension if not exists pg_cron;
create extension if not exists pg_net;

do $cron$
declare
  v_jobname text := 'payments-cleanup';
begin
  if exists (select 1 from cron.job where jobname = v_jobname) then
    perform cron.unschedule(v_jobname);
  end if;

  perform cron.schedule(
    v_jobname,
    '* * * * *', -- every minute
    $$
    select net.http_post(
      url := 'https://krapajktuulxvphsgtro.functions.supabase.co/payments-cleanup',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || coalesce(
          (select decrypted_secret from vault.decrypted_secrets where name = 'cleanup_secret'), ''
        )
      ),
      body := '{}'::jsonb,
      timeout_milliseconds := 8000
    );
    $$
  );
end;
$cron$;
