'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

import { useCartOptional } from '@/lib/cart/CartProvider';

import { CartIcon } from '../icons';

const LS_KEY = 'hd_cart_v1';

/**
 * Nav cart button. Inside the tienda (CartProvider present) it shows the live
 * count and opens the drawer; elsewhere it links to /tienda/carro with a
 * localStorage-derived count. Count is rendered only after mount to avoid SSR
 * hydration mismatch.
 */
export function CartNavButton() {
  const cart = useCartOptional();
  const [lsCount, setLsCount] = useState(0); // no-provider routes: localStorage count

  // SSR + first client render show 0 in both branches (provider starts empty), so
  // there's no hydration mismatch; the localStorage count is filled after mount.
  useEffect(() => {
    if (cart) return;
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as { lines?: { qty?: number }[] };
      const n = (parsed.lines ?? []).reduce((s, l) => s + (l.qty ?? 0), 0);
      queueMicrotask(() => setLsCount(n));
    } catch {
      /* ignore */
    }
  }, [cart]);

  const count = cart ? cart.count : lsCount;
  const label = `Carro${count > 0 ? `, ${count} ${count === 1 ? 'producto' : 'productos'}` : ''}`;

  const inner = (
    <span className="relative inline-flex items-center justify-center text-foreground">
      <CartIcon className="size-5" />
      {count > 0 && (
        <span
          aria-hidden
          className="absolute -right-2 -top-2 flex min-w-[16px] items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold leading-[16px] text-white"
        >
          {count}
        </span>
      )}
    </span>
  );

  if (cart) {
    return (
      <button
        type="button"
        onClick={cart.open}
        aria-label={label}
        className="inline-flex size-9 items-center justify-center rounded-full transition-colors hover:bg-default"
      >
        {inner}
      </button>
    );
  }

  return (
    <Link
      href="/tienda/carro"
      aria-label={label}
      className="inline-flex size-9 items-center justify-center rounded-full transition-colors hover:bg-default"
    >
      {inner}
    </Link>
  );
}
