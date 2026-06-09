import 'server-only';
import { cookies } from 'next/headers';

/** httpOnly cart token cookie. The browser never reads it; all cart writes are
 *  service-role server actions keyed by this token. */
export const CART_COOKIE = 'hd_cart';
const MAX_AGE = 60 * 60 * 24 * 30; // 30 days

export async function readCartToken(): Promise<string | null> {
  const store = await cookies();
  return store.get(CART_COOKIE)?.value ?? null;
}

export async function writeCartToken(token: string): Promise<void> {
  const store = await cookies();
  store.set(CART_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: MAX_AGE,
  });
}

export async function clearCartToken(): Promise<void> {
  const store = await cookies();
  store.delete(CART_COOKIE);
}
