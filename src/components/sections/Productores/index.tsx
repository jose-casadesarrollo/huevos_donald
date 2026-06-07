import { ProductorCarousel } from "./ProductorCarousel";
import { ProductoresHeader } from "./ProductoresHeader";
import { productores, redStats } from "./data";

export type { Productor, ProductorStat, RedStats } from "./types";
export { productores, redStats } from "./data";

// Section-scoped tokens (the spec's palette) injected via inline style so the
// component is self-contained — no edits to globals.css required. Mirrors the
// Trazabilidad / Contraste sections' SECTION_TOKENS pattern.
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

// Reduced-motion override for the progress-bar tween, inlined so we don't touch
// globals.css. The sliding track itself opts out of motion in JS (see
// ProductorCarousel), so only the progress fill needs neutralizing here.
const SECTION_KEYFRAMES = `
@media (prefers-reduced-motion: reduce) {
  .prod-progress-fill { transition-duration: 0ms !important; }
}
`;

/**
 * "Productores" landing section (04 / Nuestra red) — introduces the producer
 * network in a single-card editorial carousel. The header is server-rendered;
 * the carousel is the only interactive (client) piece.
 */
export function ProductoresSection() {
  return (
    <section
      aria-labelledby="productores-title"
      className="relative overflow-hidden bg-background py-11 text-[var(--ink)] md:py-16"
      style={SECTION_TOKENS}
    >
      <style>{SECTION_KEYFRAMES}</style>

      {/* Header stays within the centered content column. */}
      <div className="mx-auto max-w-[1280px] px-5 md:px-6">
        <ProductoresHeader stats={redStats} />
      </div>

      {/* Carousel manages its own full-bleed track + centered controls. */}
      <ProductorCarousel productores={productores} />
    </section>
  );
}
