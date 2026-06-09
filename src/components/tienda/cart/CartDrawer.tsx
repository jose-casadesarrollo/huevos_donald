'use client';

import { useEffect } from 'react';
import Link from 'next/link';

import { useCart } from '@/lib/cart/CartProvider';
import { formatClp } from '@/lib/cart/format';

import { CartIcon } from '../icons';
import { TIENDA_TOKENS } from '../tokens';
import { CartLineRow } from './CartLineRow';

/**
 * Slide-in cart drawer. Rendered once inside the tienda layout (within the
 * CartProvider, but OUTSIDE the page `<main>`), so it re-applies TIENDA_TOKENS on
 * its own root. Opened from the nav cart button or after "Agregar".
 */
export function CartDrawer() {
  const { isOpen, close, cart, subtotalCents, isHydrated, isSyncing } = useCart();

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, close]);

  const empty = cart.lines.length === 0;

  return (
    <div
      style={TIENDA_TOKENS}
      aria-hidden={!isOpen}
      className={`fixed inset-0 z-[60] ${isOpen ? '' : 'pointer-events-none'}`}
    >
      <button
        type="button"
        aria-label="Cerrar carro"
        onClick={close}
        tabIndex={isOpen ? 0 : -1}
        className={`absolute inset-0 cursor-default bg-[rgba(34,26,15,0.45)] transition-opacity duration-300 motion-reduce:transition-none ${
          isOpen ? 'opacity-100' : 'opacity-0'
        }`}
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Carro de compras"
        className={`absolute right-0 top-0 flex h-full w-[min(420px,100%)] flex-col bg-[var(--shell)] shadow-[0_0_60px_-10px_rgba(34,26,15,0.5)] transition-transform duration-300 ease-out motion-reduce:transition-none ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between border-b border-[rgba(34,26,15,0.1)] px-5 py-4">
          <h2 className="font-[var(--font-fraunces)] text-[20px] font-bold text-[var(--ink)]">
            Tu carro
          </h2>
          <button
            type="button"
            onClick={close}
            aria-label="Cerrar"
            className="flex size-8 items-center justify-center rounded-full text-[var(--ink-soft)] transition-colors hover:bg-[var(--cream)] hover:text-[var(--ink)] motion-reduce:transition-none"
          >
            <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden>
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        {empty ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
            <CartIcon className="size-10 text-[rgba(34,26,15,0.25)]" />
            <p className="font-[var(--font-dm-sans)] text-[15px] text-[var(--ink-soft)]">
              Tu carro está vacío.
            </p>
            <Link
              href="/tienda"
              onClick={close}
              className="mt-1 inline-flex items-center rounded-full bg-[var(--red)] px-5 py-2.5 font-[var(--font-dm-sans)] text-[14px] font-semibold text-[var(--shell)] shadow-[0_2px_0_var(--red-deep)]"
            >
              Ver la tienda
            </Link>
          </div>
        ) : (
          <>
            <div className="flex-1 divide-y divide-[rgba(34,26,15,0.08)] overflow-y-auto px-5">
              {cart.lines.map((line) => (
                <CartLineRow key={line.productId} line={line} />
              ))}
            </div>

            <div className="border-t border-[rgba(34,26,15,0.1)] px-5 py-4">
              <div className="flex items-center justify-between">
                <span className="font-[var(--font-dm-sans)] text-[14px] text-[var(--ink-soft)]">
                  Subtotal {isSyncing && <span className="font-[var(--font-jetbrains-mono)] text-[10px]">· actualizando…</span>}
                </span>
                <span className="font-[var(--font-fraunces)] text-[22px] font-bold text-[var(--ink)]">
                  {isHydrated ? formatClp(subtotalCents) : '—'}
                </span>
              </div>
              <p className="mt-1 font-[var(--font-jetbrains-mono)] text-[10px] tracking-[0.04em] text-[var(--ink-soft)]">
                Despacho gratis · se confirma en el checkout
              </p>
              <Link
                href="/tienda/checkout"
                onClick={close}
                className="mt-4 flex w-full items-center justify-center rounded-full bg-[var(--red)] px-6 py-3.5 font-[var(--font-dm-sans)] text-[15px] font-semibold text-[var(--shell)] shadow-[0_2px_0_var(--red-deep)] transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-[0_4px_0_var(--red-deep)] motion-reduce:transition-none"
              >
                Ir a pagar
              </Link>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
