-- Read agent-whatsapp credentials from Supabase Vault. PostgREST does not expose
-- the `vault` schema, so the edge function (service_role) reads them through this
-- locked-down SECURITY DEFINER helper instead of selecting vault.decrypted_secrets.
-- EXECUTE is granted ONLY to service_role; anon/authenticated cannot call it.
--
-- The secret VALUES are not in this file (they live encrypted in vault.secrets,
-- inserted at runtime via execute_sql — never committed).
create or replace function public.get_whatsapp_secrets()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $func$
  select coalesce(jsonb_object_agg(name, decrypted_secret), '{}'::jsonb)
  from vault.decrypted_secrets
  where name in (
    'WHATSAPP_ACCESS_TOKEN',
    'WHATSAPP_PHONE_NUMBER_ID',
    'WHATSAPP_VERIFY_TOKEN',
    'WHATSAPP_APP_SECRET'
  );
$func$;

revoke all on function public.get_whatsapp_secrets() from public, anon, authenticated;
grant execute on function public.get_whatsapp_secrets() to service_role;
