"use client";

import NumberFlow from "@number-flow/react";

import { formatValue } from "./data";
import type { MetricFormat } from "./types";

/**
 * The animated metric number. Built on `@number-flow/react` — the count-up
 * mechanism already used by the Productores section — rather than a Remotion
 * <Player>. Rationale: NumberFlow renders real inline DOM text, so it inherits
 * the card's Fraunces typography and baseline-aligns with the suffix span; it
 * formats `es-CL` natively; and it auto-respects `prefers-reduced-motion`
 * (reduced-motion users jump straight to the final value). A Player per number
 * would impose a fixed canvas, be awkward to style, and be heavier (×4).
 *
 * The animation runs by flipping `value` 0 → target when `run` turns true (the
 * grid scrolled into view); it counts once and stays at the final value.
 */
export function MetricCountUp({
  target,
  format,
  run,
}: {
  target: number;
  format: MetricFormat;
  run: boolean;
}) {
  const fmt =
    format === "decimal" ? { minimumFractionDigits: 1, maximumFractionDigits: 1 } : undefined;

  return (
    <NumberFlow
      value={run ? target : 0}
      locales="es-CL"
      format={fmt}
      aria-label={formatValue(target, format)}
      willChange
    />
  );
}
