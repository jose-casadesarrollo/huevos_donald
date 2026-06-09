// Shared cart types — pure types, safe to import from client + server.

export interface CartLineView {
  productId: string; // store_products.id
  slug: string;
  name: string;
  formatShort: string;
  unitsLabel: string;
  image: { src: string; alt: string };
  qty: number;
  unitPriceCents: number;
  lineTotalCents: number;
}

export interface CartContact {
  email: string | null;
  phone: string | null;
  name: string | null;
}

export interface CartDelivery {
  zoneId: string | null;
  comuna: string | null;
  address: string | null;
  notes: string | null;
}

/** Server-authoritative cart snapshot returned by every cart action. */
export interface CartView {
  status: string;
  lines: CartLineView[];
  subtotalCents: number;
  itemCount: number; // total boxes (Σ qty)
  currency: string;
  contact: CartContact;
  delivery: CartDelivery;
}

export type CartActionResult = { ok: true; cart: CartView } | { ok: false; error: string };

export const MIN_QTY = 1;
export const MAX_QTY = 20;

export const EMPTY_CART: CartView = {
  status: 'active',
  lines: [],
  subtotalCents: 0,
  itemCount: 0,
  currency: 'CLP',
  contact: { email: null, phone: null, name: null },
  delivery: { zoneId: null, comuna: null, address: null, notes: null },
};
