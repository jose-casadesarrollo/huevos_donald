// Normalizers mirroring the DB CHECK constraints so partial captures never bounce.

/** Chilean phone → `56XXXXXXXX(X)` or null if it can't be made valid. */
export function normalizePhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, '');
  if (!digits) return null;
  const n = digits.startsWith('56') ? digits : `56${digits}`;
  return /^56[0-9]{8,9}$/.test(n) ? n : null;
}

/** Lowercased email or null if malformed. */
export function normalizeEmail(raw: string): string | null {
  const e = raw.trim().toLowerCase();
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e) ? e : null;
}
