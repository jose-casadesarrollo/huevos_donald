'use server';

import { getCurrentUser } from '@/lib/auth/roles';
import { createStoreAdminClient, type CartRow, type StoreClient } from '@/lib/supabase/store-db';
import { clearCartToken, readCartToken, writeCartToken } from './cookie';
import { buildCartView, createCart, loadCartById, loadCartByToken, recompute } from './service';
import { EMPTY_CART, MAX_QTY, MIN_QTY, type CartActionResult } from './types';
import { normalizeEmail, normalizePhone } from './validation';

/**
 * Cart server actions — the ONLY path the browser uses to mutate the cart. They
 * run service-role (carts/cart_items are not anon-writable) and are authorized by
 * the httpOnly `hd_cart` token cookie. Prices are always re-read server-side from
 * `store_products` (never trust the client). Contact/delivery fields are captured
 * progressively (any partial subset), so an abandonment at any step still has the
 * lead. Every action returns the full authoritative cart.
 */

const clampQty = (n: number) => Math.max(MIN_QTY, Math.min(MAX_QTY, Math.round(n || 0)));
const fail = (error: string): CartActionResult => ({ ok: false, error });
const msg = (e: unknown) => (e instanceof Error ? e.message : 'Error desconocido');

async function currentUserId(): Promise<string | null> {
  try {
    const u = await getCurrentUser();
    return u?.id ?? null;
  } catch {
    return null;
  }
}

/** Load the cart for the cookie token, or create one (+ set the cookie). */
async function ensureCart(db: StoreClient): Promise<CartRow> {
  const token = await readCartToken();
  const uid = await currentUserId();
  let cart = await loadCartByToken(db, token);
  if (!cart) {
    cart = await createCart(db, uid);
    await writeCartToken(cart.token);
  } else if (uid && !cart.user_id) {
    await db.from('carts').update({ user_id: uid }).eq('id', cart.id);
    cart.user_id = uid;
  }
  return cart;
}

async function viewOf(db: StoreClient, cartId: string): Promise<CartActionResult> {
  const fresh = await loadCartById(db, cartId);
  if (!fresh) return { ok: true, cart: EMPTY_CART };
  return { ok: true, cart: await buildCartView(db, fresh) };
}

export async function getCart(): Promise<CartActionResult> {
  try {
    const db = createStoreAdminClient();
    const cart = await loadCartByToken(db, await readCartToken());
    if (!cart) return { ok: true, cart: EMPTY_CART };
    const uid = await currentUserId();
    if (uid && !cart.user_id) await db.from('carts').update({ user_id: uid }).eq('id', cart.id);
    return { ok: true, cart: await buildCartView(db, cart) };
  } catch (e) {
    return fail(msg(e));
  }
}

export async function addItem(input: { slug: string; qty?: number }): Promise<CartActionResult> {
  try {
    const db = createStoreAdminClient();
    const qty = clampQty(input.qty ?? 1);
    const { data: product } = await db
      .from('store_products')
      .select('id, unit_price_cents, active, in_stock')
      .eq('slug', input.slug)
      .maybeSingle();
    if (!product || !product.active || !product.in_stock) return fail('Producto no disponible');

    const cart = await ensureCart(db);
    const { data: existing } = await db
      .from('cart_items')
      .select('id, qty')
      .eq('cart_id', cart.id)
      .eq('product_id', product.id)
      .maybeSingle();
    if (existing) {
      await db
        .from('cart_items')
        .update({ qty: clampQty(existing.qty + qty), unit_price_cents: product.unit_price_cents })
        .eq('id', existing.id);
    } else {
      await db.from('cart_items').insert({
        cart_id: cart.id,
        product_id: product.id,
        qty,
        unit_price_cents: product.unit_price_cents,
      });
    }
    await recompute(db, cart.id);
    return viewOf(db, cart.id);
  } catch (e) {
    return fail(msg(e));
  }
}

export async function updateQty(input: { productId: string; qty: number }): Promise<CartActionResult> {
  try {
    const db = createStoreAdminClient();
    const cart = await loadCartByToken(db, await readCartToken());
    if (!cart) return { ok: true, cart: EMPTY_CART };
    const qty = Math.round(input.qty || 0);
    if (qty <= 0) {
      await db.from('cart_items').delete().eq('cart_id', cart.id).eq('product_id', input.productId);
    } else {
      const { data: product } = await db
        .from('store_products')
        .select('unit_price_cents')
        .eq('id', input.productId)
        .maybeSingle();
      await db
        .from('cart_items')
        .update({
          qty: clampQty(qty),
          ...(product ? { unit_price_cents: product.unit_price_cents } : {}),
        })
        .eq('cart_id', cart.id)
        .eq('product_id', input.productId);
    }
    await recompute(db, cart.id);
    return viewOf(db, cart.id);
  } catch (e) {
    return fail(msg(e));
  }
}

export async function removeItem(input: { productId: string }): Promise<CartActionResult> {
  return updateQty({ productId: input.productId, qty: 0 });
}

export async function updateCheckoutContact(input: {
  email?: string;
  phone?: string;
  name?: string;
}): Promise<CartActionResult> {
  try {
    const db = createStoreAdminClient();
    const cart = await ensureCart(db);
    const patch: Partial<CartRow> = {};
    if (input.email !== undefined) {
      const e = normalizeEmail(input.email);
      if (e) patch.contact_email = e;
    }
    if (input.phone !== undefined) {
      const p = normalizePhone(input.phone);
      if (p) patch.contact_phone = p;
    }
    if (input.name !== undefined) patch.contact_name = input.name.trim() || null;
    if (Object.keys(patch).length) {
      patch.last_activity_at = new Date().toISOString();
      await db.from('carts').update(patch).eq('id', cart.id);
    }
    return viewOf(db, cart.id);
  } catch (e) {
    return fail(msg(e));
  }
}

export async function updateCheckoutDelivery(input: {
  zoneId?: string | null;
  comuna?: string;
  address?: string;
  notes?: string;
}): Promise<CartActionResult> {
  try {
    const db = createStoreAdminClient();
    const cart = await ensureCart(db);
    const patch: Partial<CartRow> = {};
    if (input.zoneId !== undefined) patch.delivery_zone_id = input.zoneId || null;
    if (input.comuna !== undefined) patch.comuna = input.comuna.trim() || null;
    if (input.address !== undefined) patch.delivery_address = input.address.trim() || null;
    if (input.notes !== undefined) patch.delivery_notes = input.notes.trim() || null;
    if (Object.keys(patch).length) {
      patch.last_activity_at = new Date().toISOString();
      await db.from('carts').update(patch).eq('id', cart.id);
    }
    return viewOf(db, cart.id);
  } catch (e) {
    return fail(msg(e));
  }
}

/** Clear the cart cookie (used on /pago/exito after a confirmed purchase). */
export async function clearCartCookie(): Promise<void> {
  await clearCartToken();
}
