"use client";

import NumberFlow from "@number-flow/react";

import { useInView } from "./useInView";
import type { RedStats } from "./types";

/**
 * Header network counter (productores · regiones · intermediarios). Each value
 * counts up from 0 the first time the header scrolls into view. Client-only
 * because NumberFlow + IntersectionObserver need the browser.
 */
export function NetworkCounter({ stats }: { stats: RedStats }) {
  const { ref, inView } = useInView<HTMLDivElement>();

  const counters = [
    { value: stats.productores, label: "Productores" },
    { value: stats.regiones, label: "Regiones" },
    { value: stats.intermediarios, label: "Intermediarios" },
  ];

  return (
    <div ref={ref} className="flex items-end gap-4 pb-1 md:gap-6">
      {counters.map((counter) => (
        <div key={counter.label} className="flex flex-col">
          <NumberFlow
            value={inView ? counter.value : 0}
            locales="es-CL"
            aria-label={String(counter.value)}
            willChange
            className="font-[var(--font-fraunces)] font-bold leading-none tracking-[-0.02em] text-[var(--ink)]"
            style={{ fontSize: "clamp(26px, 3.2vw, 35px)" }}
          />
          <span className="mt-1.5 font-[var(--font-jetbrains-mono)] text-[9px] font-bold uppercase tracking-[0.18em] text-[var(--ink-soft)]">
            {counter.label}
          </span>
        </div>
      ))}
    </div>
  );
}
