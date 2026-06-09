-- Storefront catalog for /tienda (unit egg-box store). Additive + idempotent.
-- Separate from public.products (that table is the subscription-plan product
-- master: sku/name/description/image_url, referenced by plans.product_id).
-- store_products is the source of truth for storefront PRICES (server-authoritative;
-- the cart/checkout never trust client prices). Money in *_cents (pesos × 100):
-- a $2.990 box = 299000.
--
-- ⚠️ PRECIOS PLACEHOLDER y PRODUCTORES FICTICIOS (lote.producer): requieren
--    unit economics real + consentimiento del productor antes de publicar.

create table if not exists public.store_products (
  id                   uuid primary key default gen_random_uuid(),
  slug                 text not null unique,
  format_short         text not null,
  name                 text not null,
  units                integer not null check (units > 0),
  units_label          text,
  subtitle             text,
  unit_price_cents     bigint not null check (unit_price_cents >= 0),
  price_per_unit_cents bigint,
  currency             text not null default 'CLP',
  in_stock             boolean not null default true,
  active               boolean not null default true,
  sort                 integer not null default 0,
  tags                 text[] not null default '{}',
  lote                 jsonb,           -- {code,origin,producer,caliber,laid}
  content              jsonb,           -- {description,traceability,storage}
  images               jsonb not null default '[]'::jsonb,  -- [{src,alt}, ...]
  related_slugs        text[] not null default '{}',
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

create index if not exists store_products_active_sort_idx
  on public.store_products (active, sort) where active;

do $$ begin
  create trigger set_updated_at before update on public.store_products
    for each row execute function public.tg_set_updated_at();
exception when duplicate_object then null; end $$;

-- RLS: anyone may read ACTIVE products; only admins write.
alter table public.store_products enable row level security;

do $$ begin
  create policy store_products_public_read on public.store_products
    for select to anon, authenticated using (active);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy store_products_admin_read on public.store_products
    for select to authenticated using ((select public.is_admin()));
exception when duplicate_object then null; end $$;

do $$ begin
  create policy store_products_admin_write on public.store_products
    for all to authenticated
    using ((select public.is_admin())) with check ((select public.is_admin()));
exception when duplicate_object then null; end $$;

grant select on public.store_products to anon, authenticated;

-- ── Seed: the 4 boxes (mirrors src/components/tienda/data.ts; prices in cents) ──
insert into public.store_products
  (slug, format_short, name, units, units_label, subtitle, unit_price_cents,
   price_per_unit_cents, sort, tags, lote, content, images, related_slugs)
values
  ('media-docena', '½ Docena', 'Media docena', 6, '6 huevos',
   '6 huevos free range · Calibre L', 299000, 49800, 1,
   array['Calibre L','Free range'],
   '{"code":"DN·2417·SE","origin":"Granja San Esteban, V Región","producer":"Don Manuel Henríquez","caliber":"L · 60–65g","laid":"Hace 2 días"}'::jsonb,
   '{"description":"Media docena de huevos de gallinas criadas en libertad (free range) en la Granja San Esteban, en la V Región. Las gallinas pastorean al aire libre y se alimentan de forma natural, lo que se traduce en una yema más naranja, firme y sabrosa. El formato justo para quienes cocinan poco o quieren probar.","traceability":"Cada lote tiene un código único (DN·2417·SE) que identifica el campo, el productor y la fecha de postura. Escanea el código del envase para ver de dónde viene exactamente el huevo que te estás comiendo.","storage":"Mantén los huevos refrigerados. Consume preferentemente dentro de los 21 días posteriores a la postura."}'::jsonb,
   '[{"src":"/tienda/media-docena-carton.jpg","alt":"Media docena de huevos en cartón"},{"src":"/tienda/huevo-macro.jpg","alt":"Huevo en detalle macro"},{"src":"/tienda/yema.jpg","alt":"Yema naranja"},{"src":"/tienda/origen.jpg","alt":"Gallinas en el campo de origen"}]'::jsonb,
   array['docena','docena-media','bandeja-30']),

  ('docena', 'Docena', 'Docena de huevos', 12, '12 huevos',
   '12 huevos free range · Calibre L', 549000, 45700, 2,
   array['Calibre L','Free range'],
   '{"code":"DN·2418·PN","origin":"Campo Las Acacias, Paine","producer":"Familia Pérez","caliber":"L · 60–65g","laid":"Hace 2 días"}'::jsonb,
   '{"description":"Huevos de gallinas criadas en libertad (free range) en el Campo Las Acacias, en Paine. Las gallinas se alimentan en praderas al aire libre, lo que se traduce en una yema más naranja, firme y sabrosa. Cada caja viene de un lote identificado y trazable.","traceability":"Cada lote tiene un código único (DN·2418·PN) que identifica el campo, el productor y la fecha de postura. Puedes escanear el código del envase para ver toda la información del huevo que estás comiendo.","storage":"Mantén los huevos refrigerados. Por su frescura y cáscara más resistente, se conservan en óptimas condiciones por varias semanas. Consume preferentemente dentro de los 21 días posteriores a la postura."}'::jsonb,
   '[{"src":"/tienda/docena-carton.jpg","alt":"Docena de huevos en cartón abierto"},{"src":"/tienda/huevo-macro.jpg","alt":"Huevo en detalle macro"},{"src":"/tienda/yema.jpg","alt":"Yema naranja"},{"src":"/tienda/origen.jpg","alt":"Gallinas en el campo de origen"}]'::jsonb,
   array['media-docena','docena-media','bandeja-30']),

  ('docena-media', 'Docena ½', 'Docena y media', 18, '18 huevos',
   '18 huevos free range · Calibre L', 799000, 44400, 3,
   array['Calibre L','Free range'],
   '{"code":"DN·2419·MP","origin":"Huertos Mallarauco, RM","producer":"Hermanas Soto","caliber":"L · 60–65g","laid":"Hace 2 días"}'::jsonb,
   '{"description":"Docena y media de huevos free range de los Huertos Mallarauco, en la Región Metropolitana. Las gallinas se crían en praderas abiertas, sin jaulas, con una dieta natural que le da a la yema su color naranja característico. Un formato cómodo para toda la semana.","traceability":"Lote DN·2419·MP, trazable desde el campo: identifica productor, origen y fecha de postura. Escanea el código del envase para conocer la historia completa de tus huevos.","storage":"Mantén los huevos refrigerados. Consume preferentemente dentro de los 21 días posteriores a la postura."}'::jsonb,
   '[{"src":"/tienda/docena-media-carton.jpg","alt":"Docena y media de huevos en cartón"},{"src":"/tienda/huevo-macro.jpg","alt":"Huevo en detalle macro"},{"src":"/tienda/yema.jpg","alt":"Yema naranja"},{"src":"/tienda/origen.jpg","alt":"Gallinas en el campo de origen"}]'::jsonb,
   array['media-docena','docena','bandeja-30']),

  ('bandeja-30', 'Bandeja 30', 'Bandeja 30', 30, '30 huevos',
   '30 huevos free range · Calibre L', 1299000, 43300, 4,
   array['Calibre L','Free range'],
   '{"code":"DN·2420·TT","origin":"Caleu Kuram, Til Til, RM","producer":"Don Juan Cortés","caliber":"L · 60–65g","laid":"Hace 2 días"}'::jsonb,
   '{"description":"La bandeja de 30, pensada para quienes cocinan harto o son varios en casa. Huevos free range de Caleu, en Til Til, de gallinas criadas en libertad con alimentación natural. La misma frescura y trazabilidad, en formato grande y más conveniente por huevo.","traceability":"Lote DN·2420·TT, trazable desde Til Til: campo, productor y fecha de postura en un solo código. Escanéalo en el envase para ver el origen de cada huevo.","storage":"Mantén los huevos refrigerados. Consume preferentemente dentro de los 21 días posteriores a la postura."}'::jsonb,
   '[{"src":"/tienda/bandeja-30-maple.jpg","alt":"Bandeja de 30 huevos (maple)"},{"src":"/tienda/huevo-macro.jpg","alt":"Huevo en detalle macro"},{"src":"/tienda/yema.jpg","alt":"Yema naranja"},{"src":"/tienda/origen.jpg","alt":"Gallinas en el campo de origen"}]'::jsonb,
   array['media-docena','docena','docena-media'])
on conflict (slug) do nothing;
