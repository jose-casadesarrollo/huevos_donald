import type { Metadata } from "next";

import { Footer } from "@/components/landing/Footer";
import { Nav } from "@/components/landing/Nav";
import { AsmrBand } from "@/components/planes/AsmrBand";
import { CompareTable } from "@/components/planes/CompareTable";
import { FinalCta } from "@/components/planes/FinalCta";
import { PlanesHero } from "@/components/planes/PlanesHero";
import { PlanSection } from "@/components/planes/PlanSection";
import { plansFull } from "@/components/planes/data";
import { PLANES_TOKENS } from "@/components/planes/tokens";

export const metadata: Metadata = {
  title: "Planes — Huevos Donald",
  description:
    "Tres planes flexibles de huevos free range del sur de Chile: Esencial, Familia y Cocinero. Saldo mensual, despacho gratis y trazabilidad por lote. Pausa o cancela cuando quieras.",
};

/**
 * `/planes` — the dedicated product + pricing page. Five blocks (hero, three
 * zigzag plan sections, ASMR band, comparison table, closing CTA + FAQ) between
 * the shared <Nav> and <Footer>. The section palette is injected once on the
 * <main> wrapper via `PLANES_TOKENS`, so every block inherits the CSS vars.
 */
export default function PlanesPage() {
  return (
    <>
      <Nav />
      <main style={PLANES_TOKENS}>
        <PlanesHero />

        {/* Block 2 — zigzag plan sections. First gets the hero's scroll anchor. */}
        {plansFull.map((plan, i) => (
          <PlanSection
            key={plan.id}
            plan={plan}
            id={i === 0 ? "planes-detalle" : undefined}
          />
        ))}

        <AsmrBand />
        <CompareTable />
        <FinalCta />
      </main>
      <Footer />
    </>
  );
}
