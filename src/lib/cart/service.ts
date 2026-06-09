import 'server-only';

import type { CartRow, StoreClient } from '@/lib/supabase/store-db';
import type { CartLineView, CartView } from './types';

/** Pure cart operations over a service-role StoreClient. No cookie/auth concerns. */

export async function loadCartByToken(db: StoreClient, token: string | null): Promise<CartRow | null> {
  if (!token) return null;
  const { data } = await db.from('carts').select('*').eq('token', token).maybeSingle();
  return data ?? null;
}

export async function loadCartById(db: StoreClient, id: string): Promise<CartRow | null> {
  const { data } = await db.from('carts').select('*').eq('id', id).maybeSingle();
  return data ?? null;
}

export async function createCart(db: StoreClient, userId: string | null): Promise<CartRow> {
  const { data, error } = await db
    .from('carts')
    .insert({ user_id: userId, status: 'active' })
    .select('*')
    .single();
  if (error || !data) throw new Error(`createCart failed: ${error?.message ?? 'no row'}`);
  return data;
}

/** Recompute subtotal_cents + item_count (boxes) from cart_items; bump activity. */
export async function recompute(db: StoreClient, cartId: string): Promise<void> {
  const { data: items } = await db
    .from('cart_items')
    .select('qty, unit_price_cents')
    .eq('cart_id', cartId);
  const rows = items ?? [];
  const subtotal = rows.reduce((s, i) => s + i.qty * i.unit_price_cents, 0);
  const count = rows.reduce((s, i) => s + i.qty, 0);
  await db
    .from('carts')
    .update({ subtotal_cents: subtotal, item_count: count, last_activity_at: new Date().toISOString() })
    .eq('id', cartId);
}

export async function buildCartView(db: StoreClient, cart: CartRow): Promise<CartView> {
  const { data: items } = await db
    .from('cart_items')
    .select('product_id, qty, unit_price_cents')
    .eq('cart_id', cart.id);
  const rows = items ?? [];

  let lines: CartLineView[] = [];
  if (rows.length) {
    const ids = rows.map((r) => r.product_id);
    const { data: products } = await db
      .from('store_products')
      .select('id, slug, name, format_short, units, units_label, images, sort')
      .in('id', ids);
    const byId = new Map((products ?? []).map((p) => [p.id, p]));

    const tuples = rows
      .map((r) => {
        const p = byId.get(r.product_id);
        if (!p) return null;
        const imgs = (Array.isArray(p.images) ? p.images : []) as { src: string; alt: string }[];
        const line: CartLineView = {
          productId: p.id,
          slug: p.slug,
          name: p.name,
          formatShort: p.format_short,
          unitsLabel: p.units_label ?? `${p.units} huevos`,
          image: imgs[0] ?? { src: '', alt: p.name },
          qty: r.qty,
          unitPriceCents: r.unit_price_cents,
          lineTotalCents: r.qty * r.unit_price_cents,
        };
        return { sort: p.sort ?? 0, line };
      })
      .filter((t): t is { sort: number; line: CartLineView } => Boolean(t));
    tuples.sort((a, b) => a.sort - b.sort);
    lines = tuples.map((t) => t.line);
  }

  return {
    status: cart.status,
    lines,
    subtotalCents: cart.subtotal_cents,
    itemCount: cart.item_count,
    currency: cart.currency,
    contact: { email: cart.contact_email, phone: cart.contact_phone, name: cart.contact_name },
    delivery: {
      zoneId: cart.delivery_zone_id,
      comuna: cart.comuna,
      address: cart.delivery_address,
      notes: cart.delivery_notes,
    },
  };
}
