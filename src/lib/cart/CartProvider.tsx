'use client';

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

import {
  addItem as addItemAction,
  getCart as getCartAction,
  removeItem as removeItemAction,
  updateQty as updateQtyAction,
} from './actions';
import { EMPTY_CART, type CartView } from './types';

const LS_KEY = 'hd_cart_v1';

export interface CartContextValue {
  cart: CartView;
  count: number; // boxes (Σ qty), incl. in-flight optimistic adds
  subtotalCents: number;
  isHydrated: boolean;
  isSyncing: boolean;
  isOpen: boolean;
  open: () => void;
  close: () => void;
  addItem: (input: { slug: string; qty?: number }) => void;
  updateQty: (productId: string, qty: number) => void;
  removeItem: (productId: string) => void;
  clearLocal: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

/** Recompute a line qty locally using the server-provided unit price (authoritative). */
function recomputeLocal(c: CartView, productId: string, qty: number): CartView {
  const lines =
    qty <= 0
      ? c.lines.filter((l) => l.productId !== productId)
      : c.lines.map((l) =>
          l.productId === productId ? { ...l, qty, lineTotalCents: qty * l.unitPriceCents } : l,
        );
  return {
    ...c,
    lines,
    subtotalCents: lines.reduce((s, l) => s + l.lineTotalCents, 0),
    itemCount: lines.reduce((s, l) => s + l.qty, 0),
  };
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartView>(EMPTY_CART);
  const [isHydrated, setHydrated] = useState(false);
  const [optimistic, setOptimistic] = useState(0); // in-flight add qty
  const [pending, setPending] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const flushTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  // Hydrate: paint from localStorage first, then reconcile with the server cart.
  // setState is deferred out of the synchronous effect body (localStorage/server
  // are external stores synced once on mount).
  useEffect(() => {
    let alive = true;
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as CartView;
        queueMicrotask(() => {
          if (alive) setCart(parsed);
        });
      }
    } catch {
      /* ignore */
    }
    getCartAction()
      .then((res) => {
        if (alive && res.ok) setCart(res.cart);
      })
      .finally(() => {
        if (alive) setHydrated(true);
      });
    return () => {
      alive = false;
    };
  }, []);

  // Mirror to localStorage (paint accelerator; server stays authoritative).
  useEffect(() => {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(cart));
    } catch {
      /* ignore */
    }
  }, [cart]);

  const addItem = useCallback((input: { slug: string; qty?: number }) => {
    const qty = input.qty ?? 1;
    setOptimistic((o) => o + qty);
    setPending((p) => p + 1);
    addItemAction({ slug: input.slug, qty })
      .then((res) => {
        if (res.ok) setCart(res.cart);
      })
      .finally(() => {
        setOptimistic((o) => o - qty);
        setPending((p) => p - 1);
      });
  }, []);

  const updateQty = useCallback((productId: string, qty: number) => {
    setCart((c) => recomputeLocal(c, productId, qty)); // optimistic
    const timers = flushTimers.current;
    const existing = timers.get(productId);
    if (existing) clearTimeout(existing);
    timers.set(
      productId,
      setTimeout(() => {
        timers.delete(productId);
        setPending((p) => p + 1);
        updateQtyAction({ productId, qty })
          .then((res) => {
            if (res.ok) setCart(res.cart);
          })
          .finally(() => setPending((p) => p - 1));
      }, 400),
    );
  }, []);

  const removeItem = useCallback((productId: string) => {
    setCart((c) => recomputeLocal(c, productId, 0)); // optimistic
    setPending((p) => p + 1);
    removeItemAction({ productId })
      .then((res) => {
        if (res.ok) setCart(res.cart);
      })
      .finally(() => setPending((p) => p - 1));
  }, []);

  const clearLocal = useCallback(() => {
    setCart(EMPTY_CART);
    try {
      localStorage.removeItem(LS_KEY);
    } catch {
      /* ignore */
    }
  }, []);

  const value: CartContextValue = {
    cart,
    count: Math.max(0, cart.itemCount + optimistic),
    subtotalCents: cart.subtotalCents,
    isHydrated,
    isSyncing: pending > 0,
    isOpen,
    open: () => setIsOpen(true),
    close: () => setIsOpen(false),
    addItem,
    updateQty,
    removeItem,
    clearLocal,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

/** Cart context, or null when rendered outside a <CartProvider> (e.g. non-tienda routes). */
export function useCartOptional(): CartContextValue | null {
  return useContext(CartContext);
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within <CartProvider>');
  return ctx;
}
