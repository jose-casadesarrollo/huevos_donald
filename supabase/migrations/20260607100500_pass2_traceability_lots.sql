-- Pass 2 — Production lots / trazabilidad. SOP §13, §22.
--
-- Internal record per production lot (postura → clasificación → preparación →
-- despacho), linkable to deliveries. A trace_token supports QR lookup; the
-- public (anon) trace endpoint is deferred to a SECURITY DEFINER RPC that
-- returns only safe fields by token (not built here).

create table if not exists public.production_lots (
  id                  uuid primary key default gen_random_uuid(),
  lot_code            text not null unique,
  product_id          uuid references public.products(id) on delete set null,
  postura_date        date,
  classification_date date,
  prepared_date       date,
  dispatch_date       date,
  trace_token         uuid not null default gen_random_uuid(),
  notes               text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);
create index if not exists production_lots_token_idx on public.production_lots (trace_token);

alter table public.deliveries
  add column if not exists lot_id uuid references public.production_lots(id) on delete set null;

alter table public.production_lots enable row level security;

drop policy if exists lots_select_auth on public.production_lots;
create policy lots_select_auth on public.production_lots for select to authenticated
  using (true);
drop policy if exists lots_admin_all on public.production_lots;
create policy lots_admin_all on public.production_lots for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

grant select on public.production_lots to authenticated;
