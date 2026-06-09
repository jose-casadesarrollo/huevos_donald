-- Server-backed cart + multi-SKU line items for the /tienda store. Additive +
-- idempotent. Carts hold pre-auth PII (email/phone/address) captured Shopify-style
-- as the user types; they are written ONLY by the service-role server actions,
-- keyed by an httpOnly cookie token the browser never reads. No anon/authenticated
-- grants → never exposed via the REST API. Money in *_cents (pesos × 100).

-- 1) cart lifecycle enum
do $$ begin
  create type public.cart_status as enum ('active','abandoned','recovered','converted');
exception when duplicate_object then null; end $$;

-- 2) carts
create table if not exists public.carts (
  id                      uuid primary key default gen_random_uuid(),
  token                   uuid not null unique default gen_random_uuid(),
  user_id                 uuid,
  status                  public.cart_status not null default 'active',
  -- progressively-captured contact (any/all null until typed)
  contact_email           text,
  contact_phone           text,
  contact_name            text,
  -- delivery ("día asignado": comuna + address; day assigned by zone)
  delivery_zone_id        uuid,
  comuna                  text,
  delivery_address        text,
  delivery_notes          text,
  -- totals (server-recomputed; never client-trusted)
  subtotal_cents          bigint  not null default 0 check (subtotal_cents >= 0),
  currency                text    not null default 'CLP',
  item_count              integer not null default 0 check (item_count >= 0),
  -- lifecycle / abandonment
  last_activity_at        timestamptz not null default now(),
  abandoned_at            timestamptz,
  reminder_count          integer not null default 0,
  last_reminder_at        timestamptz,
  recovered_at            timestamptz,
  converted_order_id      uuid,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now(),
  constraint carts_phone_chk
    check (contact_phone is null or contact_phone ~ '^56[0-9]{8,9}$'),
  constraint carts_email_chk
    check (contact_email is null or contact_email ~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$')
);

-- 3) cart_items
create table if not exists public.cart_items (
  id               uuid primary key default gen_random_uuid(),
  cart_id          uuid not null,
  product_id       uuid not null,
  qty              integer not null check (qty > 0),
  unit_price_cents bigint  not null check (unit_price_cents >= 0),  -- snapshot at mutation time
  created_at       timestamptz not null default now(),
  constraint cart_items_cart_product_uk unique (cart_id, product_id)
);

-- 4) order_items (store multi-SKU; subscription orders simply have none)
create table if not exists public.order_items (
  id               uuid primary key default gen_random_uuid(),
  order_id         uuid not null,
  product_id       uuid,
  name             text not null,        -- snapshot (survives product rename/delete)
  qty              integer not null check (qty > 0),
  unit_price_cents bigint  not null check (unit_price_cents >= 0),
  created_at       timestamptz not null default now()
);

-- 5) orders.contact_email (guest order/abandoned-cart email recipient + later linking)
alter table public.orders add column if not exists contact_email text;

-- 6) foreign keys (guarded)
do $$ begin alter table public.carts add constraint carts_user_id_fkey
  foreign key (user_id) references public.profiles(id) on delete set null;
exception when duplicate_object then null; end $$;
do $$ begin alter table public.carts add constraint carts_delivery_zone_id_fkey
  foreign key (delivery_zone_id) references public.delivery_zones(id) on delete set null;
exception when duplicate_object then null; end $$;
do $$ begin alter table public.carts add constraint carts_converted_order_id_fkey
  foreign key (converted_order_id) references public.orders(id) on delete set null;
exception when duplicate_object then null; end $$;
do $$ begin alter table public.cart_items add constraint cart_items_cart_id_fkey
  foreign key (cart_id) references public.carts(id) on delete cascade;
exception when duplicate_object then null; end $$;
do $$ begin alter table public.cart_items add constraint cart_items_product_id_fkey
  foreign key (product_id) references public.store_products(id) on delete restrict;
exception when duplicate_object then null; end $$;
do $$ begin alter table public.order_items add constraint order_items_order_id_fkey
  foreign key (order_id) references public.orders(id) on delete cascade;
exception when duplicate_object then null; end $$;
do $$ begin alter table public.order_items add constraint order_items_product_id_fkey
  foreign key (product_id) references public.store_products(id) on delete set null;
exception when duplicate_object then null; end $$;

-- 7) indexes
create index if not exists carts_token_idx     on public.carts (token);
create index if not exists carts_status_idx     on public.carts (status);
create index if not exists carts_sweeper_idx    on public.carts (status, last_activity_at) where status = 'active';
create index if not exists carts_reminder_idx   on public.carts (status, last_reminder_at) where status = 'abandoned';
create index if not exists carts_user_idx        on public.carts (user_id);
create index if not exists carts_zone_idx        on public.carts (delivery_zone_id);
create index if not exists carts_converted_idx   on public.carts (converted_order_id);
create index if not exists cart_items_cart_idx   on public.cart_items (cart_id);
create index if not exists cart_items_product_idx on public.cart_items (product_id);
create index if not exists order_items_order_idx  on public.order_items (order_id);
create index if not exists order_items_product_idx on public.order_items (product_id);

-- 8) updated_at trigger on carts
do $$ begin create trigger set_updated_at before update on public.carts
  for each row execute function public.tg_set_updated_at();
exception when duplicate_object then null; end $$;

-- 9) RLS: carts/cart_items admin-read only, NO anon/auth grants (service role writes).
alter table public.carts      enable row level security;
alter table public.cart_items enable row level security;
alter table public.order_items enable row level security;

do $$ begin create policy carts_admin_read on public.carts
  for select to authenticated using ((select public.is_admin()));
exception when duplicate_object then null; end $$;
do $$ begin create policy cart_items_admin_read on public.cart_items
  for select to authenticated using ((select public.is_admin()));
exception when duplicate_object then null; end $$;

-- order_items: owner of the parent order, or admin
do $$ begin create policy order_items_select on public.order_items
  for select to authenticated using (
    (select public.is_admin())
    or exists (
      select 1 from public.orders o
      where o.id = order_items.order_id and o.user_id = (select auth.uid())
    )
  );
exception when duplicate_object then null; end $$;
grant select on public.order_items to authenticated;
