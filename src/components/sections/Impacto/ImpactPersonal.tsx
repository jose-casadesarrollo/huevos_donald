import { DashboardMock } from "./DashboardMock";
import type { DashboardData } from "./types";

/**
 * "Tu cuenta" block — the personal counterpart to the collective metrics. Copy +
 * yolk CTA on the left, the dashboard mock on the right. Stacks below 880px. The
 * CTA scrolls to the plans section (the conversion target), like the nav / final
 * CTA do.
 */
export function ImpactPersonal({ data }: { data: DashboardData }) {
  return (
    <div className="grid grid-cols-1 items-center gap-9 rounded-[24px] border border-[rgba(255,251,240,0.1)] bg-[rgba(255,251,240,0.04)] p-9 min-[880px]:grid-cols-2 min-[880px]:gap-14 min-[880px]:p-12">
      {/* Left — copy + CTA */}
      <div>
        <div className="font-[var(--font-jetbrains-mono)] text-[10px] font-bold uppercase tracking-[0.15em] text-[var(--yolk)]">
          — Tu cuenta —
        </div>
        <h3
          className="mt-3 font-[var(--font-fraunces)] font-bold leading-[1.08] text-[var(--shell)]"
          style={{ fontSize: "clamp(26px, 3vw, 36px)" }}
        >
          Y en tu cuenta, ves <em className="font-medium italic text-[var(--yolk)]">tu</em> propio
          impacto.
        </h3>
        <p className="mt-4 max-w-[460px] font-[var(--font-dm-sans)] text-[15px] leading-[1.55] text-[rgba(255,251,240,0.7)]">
          Cada mes actualizamos cuántos huevos llevas, cuánto CO₂ has evitado y a cuántas familias
          has apoyado con tu suscripción. Tu aporte, medido y visible.
        </p>
        <a
          href="#planes"
          className="group mt-7 inline-flex items-center gap-2 rounded-full bg-[var(--yolk)] px-6 py-[14px] font-[var(--font-dm-sans)] text-[15px] font-semibold text-[var(--ink)] shadow-[0_2px_0_var(--yolk-deep)] transition-[transform,box-shadow] duration-200 hover:-translate-y-px hover:shadow-[0_3px_0_var(--yolk-deep)] active:translate-y-px active:shadow-[0_1px_0_var(--yolk-deep)] motion-reduce:transition-none"
        >
          Empezar a sumar
          <span
            aria-hidden
            className="transition-transform duration-200 group-hover:translate-x-1 motion-reduce:transition-none"
          >
            →
          </span>
        </a>
      </div>

      {/* Right — dashboard preview */}
      <DashboardMock data={data} />
    </div>
  );
}
