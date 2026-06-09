// CLP formatting (client-safe). Money is stored in *_cents (pesos × 100).

/** 549000 cents → "$5.490" (Chilean thousands separator). */
export function formatClp(cents: number): string {
  return '$' + new Intl.NumberFormat('es-CL').format(Math.round(cents / 100));
}
