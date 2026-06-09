'use client';

import { useEffect } from 'react';

import { clearCartCookie } from '@/lib/cart/actions';

/** Clears the cart (localStorage mirror + httpOnly cookie) after a confirmed
 *  purchase. Doesn't need the CartProvider — /pago routes are outside it. */
export function ClearCartOnMount() {
  useEffect(() => {
    try {
      localStorage.removeItem('hd_cart_v1');
    } catch {
      /* ignore */
    }
    void clearCartCookie();
  }, []);
  return null;
}
