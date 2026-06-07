"use client";

import { useRef, useState, useSyncExternalStore } from "react";

import { BenefitsPill } from "./BenefitsPill";
import { PlanCard } from "./PlanCard";
import { PlanesHeader } from "./PlanesHeader";
import { commonBenefits, legalNote, planes } from "./data";
import type { Frequency } from "./types";

export type { Frequency, Plan, PlanPricing, CommonBenefit } from "./types";
export { planes, commonBenefits, legalNote } from "./data";

// Section-scoped palette tokens, injected inline so the section is
// self-contained (no globals.css edits) — mirrors the ComoFunciona / Contraste /
// Productores SECTION_TOKENS pattern.
const SECTION_TOKENS = {
  "--cream": "#F6EFDC",
  "--cream-deep": "#EFE5C9",
  "--ink": "#221A0F",
  "--ink-soft": "#4A3D2A",
  "--red": "#E61A27",
  "--red-deep": "#B81420",
  "--yolk": "#F2A900",
  "--yolk-deep": "#C97D00",
  "--shell": "#FFFBF0",
  "--moss": "#4A5D3A",
} as React.CSSProperties;

// Gently de-scale the *pricing content* (cards + benefits + legal) so it fits the
// viewport — the header is left at native scale so its eyebrow / heading / intro
// match the other landing sections. `zoom` (not `transform: scale`) is deliberate:
// it shrinks the layout box too, so the content occupies proportionally less
// height instead of leaving a gap. Media queries still read the real viewport, so
// the 860px grid switch is unaffected. Tune here — 1 = no scale, 0.95 = subtler,
// 0.88 = more aggressive.
const SECTION_SCALE = 0.92;

// Cross-fade window for the price swap (out → swap text → in).
const FADE_MS = 160;

const RM_QUERY = "(prefers-reduced-motion: reduce)";
const rmSubscribe = (cb: () => void) => {
  const mq = window.matchMedia(RM_QUERY);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
};

/** SSR-safe `prefers-reduced-motion: reduce` — `false` until mounted. */
function useReducedMotion(): boolean {
  return useSyncExternalStore(
    rmSubscribe,
    () => window.matchMedia(RM_QUERY).matches,
    () => false,
  );
}

/**
 * "Planes" landing section (06) — the conversion block. Three subscription plans
 * with a mensual/trimestral toggle that re-prices every card with a synchronized
 * cross-fade. Owns all the interactive state: `frequency` updates the toggle +
 * CTA hrefs instantly, while `displayed`/`fading` lag by the fade so the prices
 * swap mid-transition. Keeps `id="planes"` so the nav and final CTA anchor here.
 */
export function PlanesSection() {
  const reducedMotion = useReducedMotion();
  const [frequency, setFrequency] = useState<Frequency>("mensual");
  const [displayed, setDisplayed] = useState<Frequency>("mensual");
  const [fading, setFading] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleFrequencyChange = (next: Frequency) => {
    if (next === frequency) return;
    setFrequency(next);
    if (timer.current) clearTimeout(timer.current);

    if (reducedMotion) {
      setDisplayed(next);
      setFading(false);
      return;
    }

    setFading(true);
    timer.current = setTimeout(() => {
      setDisplayed(next);
      setFading(false);
    }, FADE_MS);
  };

  return (
    <section
      id="planes"
      aria-labelledby="planes-title"
      className="relative overflow-hidden bg-background px-6 py-[72px] text-[var(--ink)]"
      style={SECTION_TOKENS}
    >
      <div className="relative mx-auto max-w-[1180px]">
        {/* Header stays at native scale so its section indicator / label / intro
            match the other landing sections. */}
        <PlanesHeader frequency={frequency} onFrequencyChange={handleFrequencyChange} />

        {/* Only the pricing content is de-scaled to fit the viewport. */}
        <div style={{ zoom: SECTION_SCALE }}>
          {/* Mobile: stacked w/ gap. Desktop (≥860px): 3 cols, no gap so the cards
              share borders — the featured card scales up + overlaps. */}
          <div className="mb-7 grid grid-cols-1 gap-5 min-[860px]:grid-cols-3 min-[860px]:items-stretch min-[860px]:gap-0">
            {planes.map((plan) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                frequency={frequency}
                displayed={displayed}
                fading={fading}
              />
            ))}
          </div>

          <BenefitsPill benefits={commonBenefits} />

          <p className="mx-auto mt-5 max-w-[560px] text-center font-[var(--font-dm-sans)] text-[11px] leading-[1.4] text-[var(--ink-soft)] opacity-[0.65]">
            {legalNote}
          </p>
        </div>
      </div>
    </section>
  );
}
