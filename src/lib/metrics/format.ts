/**
 * Pure formatting + date helpers for the admin dashboard.
 * Safe to import from both server and client components (no `server-only`).
 */

/** Operation timezone — all "today"/"tomorrow" math is pinned here. */
export const APP_TZ = 'America/Santiago'

/** Fallback currency for totals that don't carry a per-row currency. */
export const DEFAULT_CURRENCY = 'CLP'

/** Format a *_cents integer as currency (no decimals). */
export function formatCurrencyCents(cents: number, currency: string = DEFAULT_CURRENCY): string {
  return new Intl.NumberFormat('es', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format((cents ?? 0) / 100)
}

/** Compact number, e.g. 12.3k. */
export function formatCompact(n: number): string {
  return new Intl.NumberFormat('es', { notation: 'compact', maximumFractionDigits: 1 }).format(n ?? 0)
}

/** Plain grouped number, e.g. 1.234. */
export function formatNumber(n: number): string {
  return new Intl.NumberFormat('es').format(n ?? 0)
}

/** Format a 0..1 ratio as a percentage. */
export function formatPercent(ratio: number, digits = 1): string {
  return new Intl.NumberFormat('es', { style: 'percent', maximumFractionDigits: digits }).format(ratio ?? 0)
}

// ---------------------------------------------------------------------------
// Date helpers — all keyed to APP_TZ and expressed as 'YYYY-MM-DD' strings.
// ---------------------------------------------------------------------------

/** 'YYYY-MM-DD' for the given instant, in APP_TZ (en-CA yields ISO order). */
export function isoDateInTz(date: Date = new Date(), tz: string = APP_TZ): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date)
}

/** Add (or subtract) whole days to a 'YYYY-MM-DD' string. */
export function addDays(isoDate: string, days: number): string {
  const d = new Date(`${isoDate}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

export function todayIso(): string {
  return isoDateInTz()
}

export function tomorrowIso(): string {
  return addDays(todayIso(), 1)
}

/** Short human label for a 'YYYY-MM-DD', e.g. "30 may". */
export function shortDayLabel(isoDate: string): string {
  return new Intl.DateTimeFormat('es', { day: 'numeric', month: 'short', timeZone: 'UTC' }).format(
    new Date(`${isoDate}T00:00:00Z`),
  )
}
