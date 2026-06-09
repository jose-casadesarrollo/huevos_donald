import 'server-only'

import { createStoreAdminClient, type StoreProductRow } from '@/lib/supabase/store-db'
import { products as mockProducts } from './data'
import type { LoteInfo, Product, ProductDetailContent, ProductImage } from './types';

/**
 * Server loader for the storefront catalog. Reads `store_products` (the
 * server-authoritative source of prices) and maps each row to the presentational
 * `Product` shape — so the tienda components render unchanged. Falls back to the
 * mock `products` from data.ts when the table doesn't exist yet / DB is
 * unreachable (e.g. before the `store_products` migration is applied), so
 * `/tienda` keeps working during the migration window.
 */

/** Integer CLP from `*_cents` (×100), Chilean thousands separator: 549000 → "5.490". */
const clp = (cents: number) => new Intl.NumberFormat('es-CL').format(Math.round(cents / 100));

function rowToProduct(row: StoreProductRow): Product {
  const images = (Array.isArray(row.images) ? row.images : []) as unknown as ProductImage[];
  return {
    id: row.id,
    slug: row.slug,
    formatShort: row.format_short,
    name: row.name,
    units: row.units,
    unitsLabel: row.units_label ?? `${row.units} huevos`,
    subtitle: row.subtitle ?? '',
    price: clp(row.unit_price_cents),
    pricePerUnit: clp(row.price_per_unit_cents ?? Math.round(row.unit_price_cents / row.units)),
    tags: row.tags ?? [],
    inStock: row.in_stock,
    images: images.length ? images : [{ src: '', alt: row.name }],
    lote: (row.lote ?? {}) as unknown as LoteInfo,
    content: (row.content ?? {}) as unknown as ProductDetailContent,
    relatedSlugs: row.related_slugs ?? [],
  };
}

export async function getStoreProducts(): Promise<Product[]> {
  try {
    const db = createStoreAdminClient();
    const { data, error } = await db
      .from('store_products')
      .select('*')
      .eq('active', true)
      .order('sort', { ascending: true });
    if (error || !data || data.length === 0) return mockProducts;
    return data.map(rowToProduct);
  } catch {
    return mockProducts;
  }
}

export async function getStoreProductBySlug(slug: string): Promise<Product | undefined> {
  const all = await getStoreProducts();
  return all.find((p) => p.slug === slug);
}

/** Resolve a product's `relatedSlugs` against the live catalog (server-authoritative). */
export async function getRelatedProducts(product: Product): Promise<Product[]> {
  const all = await getStoreProducts();
  return product.relatedSlugs
    .map((slug) => all.find((p) => p.slug === slug))
    .filter((p): p is Product => Boolean(p));
}
