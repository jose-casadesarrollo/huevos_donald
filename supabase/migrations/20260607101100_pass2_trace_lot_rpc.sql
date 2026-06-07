-- Pass 2 — Public QR traceability lookup. SOP §13, §22.
--
-- production_lots is admin/authenticated-only, but a QR code must be scannable by
-- anyone (anon). This SECURITY DEFINER RPC is the controlled exception: it returns
-- ONLY safe, public-facing lot fields, and ONLY for the row matching the opaque
-- trace_token — no enumeration, no internal columns. EXECUTE is intentionally
-- granted to anon for the public trace endpoint (the security advisor flags
-- anon-executable definer functions; this one is deliberate and minimal).

create or replace function public.trace_lot(p_token uuid)
returns table (
  lot_code            text,
  postura_date        date,
  classification_date date,
  prepared_date       date,
  dispatch_date       date
)
language sql stable security definer set search_path = public as $fn$
  select l.lot_code, l.postura_date, l.classification_date, l.prepared_date, l.dispatch_date
  from public.production_lots l
  where l.trace_token = p_token;
$fn$;

revoke all on function public.trace_lot(uuid) from public;
grant execute on function public.trace_lot(uuid) to anon, authenticated;
