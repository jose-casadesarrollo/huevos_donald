'use server';

import { getCurrentUser } from '@/lib/auth/roles';
import { readCartToken } from '@/lib/cart/cookie';
import { loadCartByToken } from '@/lib/cart/service';
import { createStoreAdminClient, type StoreClient } from '@/lib/supabase/store-db';

export type CheckoutResult = { ok: true; initPoint: string } | { ok: false; error: string };

const fail = (error: string): CheckoutResult => ({ ok: false, error });

/**
 * Convert the current cart into an order (+ order_items) and return the
 * MercadoPago init_point. Order creation runs service-role here (consistent with
 * the config-CMS service-role pattern); the money-critical pay link is produced by
 * the existing `payments-create` Edge Function (reuses `createOrderPaymentLink`).
 *
 * Prices/eggs are re-derived server-side from `store_products` (client totals are
 * never trusted). Idempotent: if the cart already has a payable order, that order
 * is reused instead of creating a duplicate.
 */
export async function startCheckout(): Promise<CheckoutResult> {
  try {
    const db = createStoreAdminClient();
    const cart = await loadCartByToken(db, await readCartToken());
    if (!cart) return fail('Tu carro está vacío.');

    // Re-price from store_products.
    const { data: items } = await db
      .from('cart_items')
      .select('product_id, qty')
      .eq('cart_id', cart.id);
    const rows = (items ?? []) as { product_id: string; qty: number }[];
    if (rows.length === 0) return fail('Tu carro está vacío.');

    const { data: products } = await db
      .from('store_products')
      .select('id, name, units, unit_price_cents, active, in_stock')
      .in(
        'id',
        rows.map((r) => r.product_id),
      );
    const byId = new Map(
      ((products ?? []) as {
        id: string;
        name: string;
        units: number;
        unit_price_cents: number;
        active: boolean;
        in_stock: boolean;
      }[]).map((p) => [p.id, p]),
    );

    let amountCents = 0;
    let eggs = 0;
    const orderItems: { product_id: string; name: string; qty: number; unit_price_cents: number }[] = [];
    for (const r of rows) {
      const p = byId.get(r.product_id);
      if (!p || !p.active || !p.in_stock) return fail('Un producto del carro ya no está disponible.');
      amountCents += r.qty * p.unit_price_cents;
      eggs += r.qty * p.units;
      orderItems.push({ product_id: p.id, name: p.name, qty: r.qty, unit_price_cents: p.unit_price_cents });
    }
    if (amountCents <= 0) return fail('El total del carro es inválido.');

    // Required captured fields.
    if (!cart.contact_email) return fail('Falta tu correo.');
    if (!cart.contact_phone) return fail('Falta tu teléfono.');
    if (!cart.delivery_zone_id) return fail('Falta tu comuna de despacho.');
    if (!cart.delivery_address) return fail('Falta tu dirección.');

    // Idempotency: reuse an existing payable order for this cart.
    const existingOrderId = await reusablePayableOrder(db, cart.converted_order_id);
    let orderId = existingOrderId;

    if (!orderId) {
      const user = await getCurrentUser().catch(() => null);
      const { data: order, error: orderErr } = await db
        .from('orders')
        .insert({
          user_id: user?.id ?? cart.user_id ?? null,
          contact_phone: cart.contact_phone,
          contact_name: cart.contact_name,
          contact_email: cart.contact_email,
          amount_cents: amountCents,
          quantity: eggs,
          currency: 'CLP',
          status: 'pending',
          source: 'web',
          delivery_zone_id: cart.delivery_zone_id,
          delivery_address: cart.delivery_address,
          delivery_notes: cart.delivery_notes,
        })
        .select('id')
        .single();
      if (orderErr || !order) return fail('No se pudo crear el pedido.');
      const newOrderId = order.id;
      orderId = newOrderId;

      await db.from('order_items').insert(orderItems.map((oi) => ({ ...oi, order_id: newOrderId })));
      await db.from('carts').update({ converted_order_id: newOrderId }).eq('id', cart.id);
    }

    if (!orderId) return fail('No se pudo crear el pedido.');
    const initPoint = await createPayLink(orderId, cart.contact_email);
    return { ok: true, initPoint };
  } catch (e) {
    return fail(e instanceof Error ? e.message : 'Error al iniciar el pago.');
  }
}

/** An order linked to the cart that is still payable → reuse it (avoid dupes). */
async function reusablePayableOrder(db: StoreClient, orderId: string | null): Promise<string | null> {
  if (!orderId) return null;
  const { data } = await db.from('orders').select('id, status').eq('id', orderId).maybeSingle();
  if (data && ['pending', 'awaiting_payment'].includes(data.status as string)) return data.id as string;
  return null;
}

/** Get a MercadoPago init_point for an order via the existing payments-create fn. */
async function createPayLink(orderId: string, payerEmail: string | null): Promise<string> {
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/payments-create`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: anon,
      Authorization: `Bearer ${anon}`,
    },
    body: JSON.stringify({ orderId, payerEmail }),
  });
  if (!res.ok) throw new Error('No se pudo iniciar el pago.');
  const data = (await res.json()) as { initPoint?: string };
  if (!data.initPoint) throw new Error('No se pudo iniciar el pago.');
  return data.initPoint;
}
