import { ComparisonCard } from "./ComparisonCard";
import { ContrasteHeader } from "./ContrasteHeader";

export type { ComparisonCell, Criterion } from "./types";
export { criterios } from "./data";

// Section-scoped tokens (the spec's palette) injected via inline style so the
// component is self-contained — no edits to globals.css required. Mirrors the
// Trazabilidad section's SECTION_TOKENS pattern.
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
  "--gray-cold": "#8A8175",
  "--gray-cold-deep": "#6B6359",
} as React.CSSProperties;

/**
 * "Contraste" landing section — a non-confrontational, two-column comparison
 * between the current industrial egg system and the Huevos Donald model.
 * Server-rendered and purely presentational (no client interactivity).
 */
export function ContrasteSection() {
  return (
    <section
      aria-labelledby="contraste-title"
      className="relative overflow-hidden bg-background px-6 py-16 text-[var(--ink)]"
      style={SECTION_TOKENS}
    >
      <div className="relative mx-auto max-w-[1280px]">
        <ContrasteHeader />
        <ComparisonCard />
      </div>
    </section>
  );
}
