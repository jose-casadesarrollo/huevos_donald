import { ImpactPersonal } from "./ImpactPersonal";
import { ImpactoHeader } from "./ImpactoHeader";
import { MethodNote } from "./MethodNote";
import { MetricsGrid } from "./MetricsGrid";
import { dashboardExample, methodNote } from "./data";

export type { Metric, MetricFormat, MetricKind, DashboardData } from "./types";
export { metrics, dashboardExample, methodNote } from "./data";

// Section-scoped palette tokens, injected inline so the section is
// self-contained — mirrors the other sections' SECTION_TOKENS pattern. Adds
// `--moss-light`, a lighter green that stays legible on the black background.
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
  "--moss-light": "#6B8254",
} as React.CSSProperties;

// Faint 70px grid hairlines over the black background.
const GRID_TEXTURE =
  "repeating-linear-gradient(0deg, transparent 0, transparent 70px, rgba(255,251,240,0.015) 70px, rgba(255,251,240,0.015) 71px)," +
  "repeating-linear-gradient(90deg, transparent 0, transparent 70px, rgba(255,251,240,0.015) 70px, rgba(255,251,240,0.015) 71px)";

/**
 * "Impacto" landing section (07) — the closing-with-purpose block on a black
 * background: four collective impact metrics that count up on scroll-in, the
 * user's personal impact (copy + dashboard preview), and a methodology footnote.
 * Server-rendered shell; the count-up grid is the only client island.
 */
export function ImpactoSection() {
  return (
    <section
      id="impacto"
      aria-labelledby="impacto-title"
      className="relative overflow-hidden bg-[var(--ink)] px-6 py-[88px] text-[var(--shell)]"
      style={SECTION_TOKENS}
    >
      {/* Faint grid texture */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{ backgroundImage: GRID_TEXTURE }}
      />
      {/* Soft yellow glow, top-center */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-[-20%] h-[400px] w-[700px] -translate-x-1/2"
        style={{ background: "radial-gradient(ellipse, rgba(242,169,0,0.06) 0%, transparent 70%)" }}
      />

      <div className="relative z-[1] mx-auto max-w-[1200px]">
        <ImpactoHeader />
        <MetricsGrid />
        <ImpactPersonal data={dashboardExample} />
        <MethodNote note={methodNote} />
      </div>
    </section>
  );
}
