'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';

import { updateCheckoutContact, updateCheckoutDelivery } from '@/lib/cart/actions';
import { useCart } from '@/lib/cart/CartProvider';
import { formatClp } from '@/lib/cart/format';
import { startCheckout } from '@/lib/checkout/actions';
import type { CheckoutPrefill, ZoneOption } from '@/lib/checkout/queries';

import { CartIcon } from '../icons';
import { ProductImage } from '../ProductImage';

type SaveState = 'idle' | 'saving' | 'saved';

const fieldCls =
  'w-full rounded-[10px] border border-[rgba(34,26,15,0.18)] bg-[var(--shell)] px-3.5 py-2.5 font-[var(--font-dm-sans)] text-[15px] text-[var(--ink)] outline-none transition-colors focus:border-[var(--ink)] motion-reduce:transition-none';
const labelCls =
  'font-[var(--font-jetbrains-mono)] text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--ink-soft)]';

function SaveTag({ state }: { state: SaveState }) {
  if (state === 'idle') return null;
  return (
    <span
      aria-live="polite"
      className="font-[var(--font-jetbrains-mono)] text-[10px] tracking-[0.04em] text-[var(--moss)]"
    >
      {state === 'saving' ? 'Guardando…' : 'Guardado ✓'}
    </span>
  );
}

/**
 * Single-page checkout with progressive (Shopify-style) capture: Contacto and
 * Despacho autosave on blur to the server cart, so an abandonment at any step
 * still leaves the lead. "Pagar" flushes both, creates the order and redirects to
 * MercadoPago. Totals are server-authoritative (from the cart context).
 */
export function CheckoutView({ zones, prefill }: { zones: ZoneOption[]; prefill: CheckoutPrefill }) {
  const { cart, subtotalCents, isHydrated } = useCart();

  const [email, setEmail] = useState(cart.contact.email ?? prefill.email ?? '');
  const [phone, setPhone] = useState(cart.contact.phone ?? prefill.phone ?? '');
  const [name, setName] = useState(cart.contact.name ?? prefill.name ?? '');
  const [zoneId, setZoneId] = useState(cart.delivery.zoneId ?? '');
  const [address, setAddress] = useState(cart.delivery.address ?? '');
  const [notes, setNotes] = useState(cart.delivery.notes ?? '');

  const [contactSave, setContactSave] = useState<SaveState>('idle');
  const [deliverySave, setDeliverySave] = useState<SaveState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [pending, startPay] = useTransition();

  async function saveContact() {
    setContactSave('saving');
    await updateCheckoutContact({ email, phone, name });
    setContactSave('saved');
  }
  async function saveDelivery() {
    setDeliverySave('saving');
    const zone = zones.find((z) => z.id === zoneId);
    await updateCheckoutDelivery({
      zoneId: zoneId || null,
      comuna: zone?.comuna ?? zone?.name ?? undefined,
      address,
      notes,
    });
    setDeliverySave('saved');
  }

  function pay() {
    setError(null);
    startPay(async () => {
      await saveContact();
      await saveDelivery();
      const res = await startCheckout();
      if (res.ok) window.location.assign(res.initPoint);
      else setError(res.error);
    });
  }

  if (cart.lines.length === 0) {
    return (
      <div className="mx-auto flex max-w-[1240px] flex-col items-center justify-center gap-4 py-24 text-center">
        <CartIcon className="size-12 text-[rgba(34,26,15,0.25)]" />
        <h1 className="font-[var(--font-fraunces)] text-[28px] font-bold text-[var(--ink)]">
          No hay nada para pagar
        </h1>
        <Link
          href="/tienda"
          className="inline-flex items-center rounded-full bg-[var(--red)] px-6 py-3 font-[var(--font-dm-sans)] text-[15px] font-semibold text-[var(--shell)] shadow-[0_2px_0_var(--red-deep)]"
        >
          Ver la tienda
        </Link>
      </div>
    );
  }

  const total = isHydrated ? formatClp(subtotalCents) : '—';

  return (
    <div className="mx-auto grid max-w-[1240px] grid-cols-1 gap-10 lg:grid-cols-[1fr_400px]">
      {/* Form */}
      <div className="flex flex-col gap-8">
        <h1 className="font-[var(--font-fraunces)] text-[32px] font-bold text-[var(--ink)]">Checkout</h1>

        {/* Contacto */}
        <section className="rounded-[16px] border border-[rgba(34,26,15,0.1)] bg-[var(--cream)] p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-[var(--font-fraunces)] text-[18px] font-bold text-[var(--ink)]">Contacto</h2>
            <SaveTag state={contactSave} />
          </div>
          <div className="flex flex-col gap-4">
            <label className="flex flex-col gap-1.5">
              <span className={labelCls}>Correo</span>
              <input
                type="email"
                inputMode="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={saveContact}
                placeholder="tu@correo.com"
                className={fieldCls}
              />
            </label>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-1.5">
                <span className={labelCls}>Teléfono</span>
                <input
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  onBlur={saveContact}
                  placeholder="+56 9 1234 5678"
                  className={fieldCls}
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className={labelCls}>Nombre</span>
                <input
                  type="text"
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onBlur={saveContact}
                  placeholder="Tu nombre"
                  className={fieldCls}
                />
              </label>
            </div>
            <p className="font-[var(--font-dm-sans)] text-[12px] text-[var(--ink-soft)]">
              Continúas como invitado.{' '}
              <Link href="/login?next=/tienda/checkout" className="font-semibold text-[var(--red)] underline">
                ¿Ya tienes cuenta? Inicia sesión
              </Link>
            </p>
          </div>
        </section>

        {/* Despacho */}
        <section className="rounded-[16px] border border-[rgba(34,26,15,0.1)] bg-[var(--cream)] p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-[var(--font-fraunces)] text-[18px] font-bold text-[var(--ink)]">Despacho</h2>
            <SaveTag state={deliverySave} />
          </div>
          <div className="flex flex-col gap-4">
            <label className="flex flex-col gap-1.5">
              <span className={labelCls}>Comuna</span>
              <select
                value={zoneId}
                onChange={(e) => setZoneId(e.target.value)}
                onBlur={saveDelivery}
                className={fieldCls}
              >
                <option value="">Selecciona tu comuna…</option>
                {zones.map((z) => (
                  <option key={z.id} value={z.id}>
                    {z.comuna ?? z.name}
                  </option>
                ))}
              </select>
              {zones.length === 0 && (
                <span className="font-[var(--font-dm-sans)] text-[12px] text-[var(--ink-soft)]">
                  Aún estamos cargando las comunas con despacho.
                </span>
              )}
            </label>
            <label className="flex flex-col gap-1.5">
              <span className={labelCls}>Dirección</span>
              <input
                type="text"
                autoComplete="street-address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                onBlur={saveDelivery}
                placeholder="Calle, número, depto"
                className={fieldCls}
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className={labelCls}>Notas (opcional)</span>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                onBlur={saveDelivery}
                rows={2}
                placeholder="Referencias para la entrega"
                className={fieldCls}
              />
            </label>
            <p className="font-[var(--font-jetbrains-mono)] text-[10px] tracking-[0.04em] text-[var(--ink-soft)]">
              Despacho gratis en tu comuna, en el día asignado.
            </p>
          </div>
        </section>
      </div>

      {/* Summary */}
      <aside className="h-fit rounded-[18px] border border-[rgba(34,26,15,0.1)] bg-[var(--shell)] p-5 lg:sticky lg:top-[120px]">
        <h2 className="font-[var(--font-fraunces)] text-[18px] font-bold text-[var(--ink)]">Tu pedido</h2>
        <ul className="mt-4 flex flex-col gap-3">
          {cart.lines.map((line) => (
            <li key={line.productId} className="flex items-center gap-3">
              <div className="relative size-12 shrink-0 overflow-hidden rounded-[10px] border border-[rgba(34,26,15,0.08)] bg-[var(--cream-deep)]">
                <ProductImage image={line.image} sizes="48px" />
              </div>
              <div className="flex-1 leading-tight">
                <p className="font-[var(--font-dm-sans)] text-[13px] font-semibold text-[var(--ink)]">
                  {line.name}
                </p>
                <p className="font-[var(--font-jetbrains-mono)] text-[10px] text-[var(--ink-soft)]">
                  ×{line.qty}
                </p>
              </div>
              <span className="font-[var(--font-fraunces)] text-[14px] font-bold text-[var(--ink)]">
                {formatClp(line.lineTotalCents)}
              </span>
            </li>
          ))}
        </ul>

        <dl className="mt-4 flex flex-col gap-2 border-t border-[rgba(34,26,15,0.1)] pt-4 font-[var(--font-dm-sans)] text-[14px]">
          <div className="flex items-center justify-between">
            <dt className="text-[var(--ink-soft)]">Subtotal</dt>
            <dd className="font-semibold text-[var(--ink)]">{total}</dd>
          </div>
          <div className="flex items-center justify-between">
            <dt className="text-[var(--ink-soft)]">Despacho</dt>
            <dd className="font-semibold text-[var(--moss)]">Gratis</dd>
          </div>
        </dl>
        <div className="mt-3 flex items-center justify-between border-t border-[rgba(34,26,15,0.1)] pt-3">
          <span className="font-[var(--font-dm-sans)] text-[14px] font-semibold text-[var(--ink)]">Total</span>
          <span className="font-[var(--font-fraunces)] text-[24px] font-bold text-[var(--ink)]">{total}</span>
        </div>

        {error && (
          <p
            role="alert"
            className="mt-4 rounded-[10px] border border-[rgba(230,26,39,0.3)] bg-[rgba(230,26,39,0.08)] px-3 py-2 font-[var(--font-dm-sans)] text-[13px] text-[var(--red-deep)]"
          >
            {error}
          </p>
        )}

        <button
          type="button"
          onClick={pay}
          disabled={pending}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-[var(--red)] px-6 py-3.5 font-[var(--font-dm-sans)] text-[15px] font-semibold text-[var(--shell)] shadow-[0_2px_0_var(--red-deep)] transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-[0_4px_0_var(--red-deep)] disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:transition-none"
        >
          {pending ? 'Redirigiendo…' : 'Pagar con MercadoPago'}
        </button>
        <p className="mt-3 text-center font-[var(--font-jetbrains-mono)] text-[10px] tracking-[0.04em] text-[var(--ink-soft)]">
          Pago seguro · IVA incluido
        </p>
      </aside>
    </div>
  );
}
