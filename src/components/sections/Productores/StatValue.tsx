"use client";

import NumberFlow from "@number-flow/react";

/** A bare integer like "320" — eligible for the count-up animation. */
const PLAIN_INT = /^\d+$/;

interface StatValueProps {
  value: string;
  /** When true, animate from 0 up to the value (once the section is in view). */
  run: boolean;
}

/**
 * Renders a stat value. Bare-integer values (e.g. the hen count "320") animate
 * with NumberFlow when `run` flips true; values carrying units or symbols
 * ("1.500 m²", "~280/día") render as static text. NumberFlow auto-respects
 * `prefers-reduced-motion`, so reduced-motion users just see the final number.
 */
export function StatValue({ value, run }: StatValueProps) {
  if (!PLAIN_INT.test(value)) return <>{value}</>;

  return (
    <NumberFlow value={run ? Number(value) : 0} locales="es-CL" aria-label={value} willChange />
  );
}
