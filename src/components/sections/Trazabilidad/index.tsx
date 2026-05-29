import { Certificate } from "./Certificate";
import { InfoList } from "./InfoList";
import { loteEjemplo } from "./data";
import type { Lote } from "./types";

export type { Lote, TimelineStep } from "./types";
export { loteEjemplo } from "./data";

interface TrazabilidadSectionProps {
  lote?: Lote;
}

// Section-scoped tokens (the spec's palette) injected via inline style so the
// component is self-contained — no edits to globals.css required.
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

// Keyframes for the timeline "current" dot pulse + reduced-motion overrides.
// Inlined so we don't need to touch globals.css.
const SECTION_KEYFRAMES = `
@keyframes traza-ping {
  0%   { transform: scale(1);   opacity: 0.4; }
  100% { transform: scale(1.4); opacity: 0;   }
}
@media (prefers-reduced-motion: reduce) {
  .traza-ping { animation: none !important; }
  .traza-cert { transform: none !important; }
}
`;

export function TrazabilidadSection({ lote = loteEjemplo }: TrazabilidadSectionProps) {
  return (
    <section
      aria-labelledby="trazabilidad-title"
      className="relative overflow-hidden bg-background px-4 py-14 text-[var(--ink)] sm:px-5 md:px-6 md:py-[100px]"
      style={SECTION_TOKENS}
    >
      <style>{SECTION_KEYFRAMES}</style>

      <div className="relative mx-auto max-w-[1280px]">
        {/* Header */}
        <header className="grid gap-8 md:grid-cols-2 md:gap-10">
          <div className="flex flex-col gap-5">
            <div className="flex items-center gap-3">
              <span
                aria-hidden
                className="inline-block h-px w-7 bg-[var(--red)]"
              />
              <span className="font-[var(--font-jetbrains-mono)] text-[11px] font-medium uppercase tracking-[0.2em]">
                <span className="text-[var(--ink-soft)]">02 /</span>{" "}
                <span className="text-[var(--red)]">Trazabilidad</span>
              </span>
            </div>
            <h2
              id="trazabilidad-title"
              className="font-[var(--font-fraunces)] font-bold leading-[0.98] tracking-tight text-[var(--ink)]"
              style={{ fontSize: "clamp(34px, 7vw, 76px)" }}
            >
              Cada huevo
              <br />
              tiene{" "}
              <em className="font-medium italic text-[var(--red)]">historia.</em>
            </h2>
          </div>

          <div className="md:pt-3">
            <p className="max-w-[380px] font-[var(--font-dm-sans)] text-[17px] leading-[1.55] text-[var(--ink-soft)]">
              Cada caja trae un código único. Lo escaneás y aparece todo: quién la produjo,
              cuándo, cómo se alimentaron las gallinas y los kilómetros que viajó.
            </p>
          </div>
        </header>

        {/* Main: certificate + info column */}
        <div className="mt-10 grid gap-10 md:mt-14 md:gap-12 lg:grid-cols-[1.15fr_0.85fr] lg:gap-16">
          <div className="min-w-0">
            <Certificate lote={lote} />
          </div>

          <div className="flex min-w-0 flex-col gap-6">
            {/* Overline */}
            <div className="flex items-center gap-2.5">
              <span aria-hidden className="inline-block h-px w-5 bg-[var(--red)]" />
              <span className="font-[var(--font-jetbrains-mono)] text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--red)]">
                Lo que vas a saber
              </span>
            </div>

            {/* H3 */}
            <h3
              className="font-[var(--font-fraunces)] font-bold leading-[1.05] tracking-tight text-[var(--ink)]"
              style={{ fontSize: "clamp(24px, 5vw, 38px)" }}
            >
              Escaneás el código.{" "}
              <em className="font-medium italic text-[var(--red)]">
                Conocés tu huevo.
              </em>
            </h3>

            {/* Description */}
            <p className="font-[var(--font-dm-sans)] text-[16px] leading-[1.6] text-[var(--ink-soft)]">
              Cada lote llega con una ficha como esta. Sin marketing, sin claims vacíos.
              Solo los datos que te permiten decidir qué entra a tu cocina.
            </p>

            <InfoList />

            {/* CTAs */}
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <a
                href="#planes"
                className={[
                  "inline-flex items-center gap-1.5 rounded-full px-6 py-3.5",
                  "bg-[var(--red)] text-[var(--shell)]",
                  "font-[var(--font-dm-sans)] text-[14px] font-semibold",
                  "shadow-[0_2px_0_var(--red-deep)]",
                  "transition-all duration-200 ease-out",
                  "hover:-translate-y-0.5 hover:shadow-[0_4px_0_var(--red-deep)]",
                ].join(" ")}
              >
                Empezar mi suscripción
                <span aria-hidden>→</span>
              </a>
              <a
                href="#ejemplo"
                className={[
                  "inline-flex items-center rounded-full border border-[var(--ink)]/20",
                  "px-4 py-3.5 text-[var(--ink)]",
                  "font-[var(--font-dm-sans)] text-[14px] font-semibold",
                  "transition-colors duration-200 ease-out",
                  "hover:border-[var(--ink)] hover:bg-[var(--shell)]",
                ].join(" ")}
              >
                Ver ejemplo en vivo
              </a>
            </div>
          </div>
        </div>

        {/* Footer note */}
        <div
          className={[
            "mt-12 grid gap-3 border-t border-[var(--ink)]/10 pt-6 md:mt-20 md:pt-8",
            "md:grid-cols-[auto_1fr_auto] md:items-center md:gap-8",
          ].join(" ")}
        >
          <div className="font-[var(--font-jetbrains-mono)] text-[11px] font-medium uppercase tracking-[0.1em] text-[var(--ink-soft)]">
            Sistema de trazabilidad v1.0
          </div>
          <div className="font-[var(--font-dm-sans)] text-[13px] text-[var(--ink-soft)] md:text-center">
            Toda la información de cada lote es ingresada por el productor y verificada por
            nuestro equipo antes del despacho.{" "}
            <strong className="font-[var(--font-fraunces)] font-bold italic text-[var(--ink)]">
              Sin excepciones.
            </strong>
          </div>
          <div className="font-[var(--font-jetbrains-mono)] text-[11px] font-medium uppercase tracking-[0.1em] text-[var(--ink-soft)] md:text-right">
            Last update — 29.05.2026
          </div>
        </div>
      </div>
    </section>
  );
}
