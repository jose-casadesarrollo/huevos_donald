'use client';

import Link from 'next/link';

import { useCart } from '@/lib/cart/CartProvider';
import { formatClp } from '@/lib/cart/format';

import { CartIcon } from '../icons';
import { CartLineRow } from './CartLineRow';

const CTA =
  'flex w-full items-center justify-center rounded-full bg-[var(--red)] px-6 py-3.5 font-[var(--font-dm-sans)] text-[15px] font-semibold text-[var(--shell)] shadow-[0_2px_0_var(--red-deep)] transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-[0_4px_0_var(--red-deep)] motion-reduce:transition-none';

/** Full cart page body. */
export function CartView() {
  const { cart, subtotalCents, isHydrated } = useCart();

  if (cart.lines.length === 0) {
    return (
      <div className="mx-auto flex max-w-[1240px] flex-col items-center justify-center gap-4 py-24 text-center">
        <CartIcon className="size-12 text-[rgba(34,26,15,0.25)]" />
        <h1 className="font-[var(--font-fraunces)] text-[28px] font-bold text-[var(--ink)]">
          Tu carro está vacío
        </h1>
        <p className="max-w-[420px] font-[var(--font-dm-sans)] text-[15px] text-[var(--ink-soft)]">
          Agrega cajas de huevos free range, del mismo lote trazable.
        </p>
        <Link
          href="/tienda"
          className="mt-1 inline-flex items-center rounded-full bg-[var(--red)] px-6 py-3 font-[var(--font-dm-sans)] text-[15px] font-semibold text-[var(--shell)] shadow-[0_2px_0_var(--red-deep)]"
        >
          Ver la tienda
        </Link>
      </div>
    );
  }

  const total = isHydrated ? formatClp(subtotalCents) : '—';

  return (
    <div className="mx-auto grid max-w-[1240px] grid-cols-1 gap-10 lg:grid-cols-[1fr_360px]">
      <div>
        <h1 className="font-[var(--font-fraunces)] text-[32px] font-bold text-[var(--ink)]">
          Tu carro
        </h1>
        <div className="mt-5 divide-y divide-[rgba(34,26,15,0.08)] border-y border-[rgba(34,26,15,0.08)]">
          {cart.lines.map((line) => (
            <CartLineRow key={line.productId} line={line} />
          ))}
        </div>
      </div>

      <aside className="h-fit rounded-[18px] border border-[rgba(34,26,15,0.1)] bg-[var(--shell)] p-5 lg:sticky lg:top-[120px]">
        <h2 className="font-[var(--font-fraunces)] text-[18px] font-bold text-[var(--ink)]">Resumen</h2>
        <dl className="mt-4 flex flex-col gap-2 font-[var(--font-dm-sans)] text-[14px]">
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
        <Link href="/tienda/checkout" className={`mt-5 ${CTA}`}>
          Ir a pagar
        </Link>
        <p className="mt-3 text-center font-[var(--font-jetbrains-mono)] text-[10px] tracking-[0.04em] text-[var(--ink-soft)]">
          Despacho gratis en tu comuna, en el día asignado.
        </p>
      </aside>
    </div>
  );
}
