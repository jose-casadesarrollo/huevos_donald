import type { PlanMediaFicha } from "./types";

/**
 * The consolidated "ficha" card pinned to the bottom of a plan photo (and reused
 * conceptually in the hero floats). One frosted card, two stacked rows:
 *
 *   ┌──────────────────────────────────────────┐
 *   │ CALIBRE L · YEMA NARANJA      [DN·2417·SE] │  ← stat pills + lote (rojo, derecha)
 *   ├──────────────────────────────────────────┤
 *   │ SALDO MENSUAL                    $7.990    │
 *   │ 18 huevos                        al mes    │  ← saldo + precio
 *   └──────────────────────────────────────────┘
 *
 * All stats/lote are informational, not critical for screen readers — the plan's
 * real price + name live in the content column of <PlanSection>.
 */
export function FichaCard({ ficha }: { ficha: PlanMediaFicha }) {
  return (
    <div className="absolute bottom-5 left-5 right-5 z-[4] flex flex-col overflow-hidden rounded-2xl border border-[rgba(255,251,240,0.12)] bg-[rgba(26,20,16,0.88)] shadow-[0_16px_36px_-12px_rgba(0,0,0,0.5)] backdrop-blur-[10px]">
      {/* Stats row */}
      <div className="flex flex-wrap items-center gap-2 border-b border-[rgba(255,251,240,0.12)] px-4 py-3">
        {ficha.stats.map((stat) => (
          <span
            key={stat}
            className="rounded-full bg-[rgba(255,251,240,0.08)] px-[9px] py-1 font-[var(--font-jetbrains-mono)] text-[8px] font-bold uppercase tracking-[0.12em] text-[rgba(255,251,240,0.85)]"
          >
            {stat}
          </span>
        ))}
        <span className="ml-auto rounded-full bg-[rgba(230,26,39,0.85)] px-[9px] py-1 font-[var(--font-jetbrains-mono)] text-[8px] font-bold uppercase tracking-[0.12em] text-[var(--shell)]">
          {ficha.loteCode}
        </span>
      </div>

      {/* Saldo + precio */}
      <div className="flex items-center justify-between gap-3 px-[18px] pb-4 pt-3.5">
        <div>
          <div className="mb-1 font-[var(--font-jetbrains-mono)] text-[8px] font-bold uppercase tracking-[0.15em] text-[var(--yolk)]">
            {ficha.saldoLabel}
          </div>
          <div className="font-[var(--font-fraunces)] text-[26px] font-bold leading-none text-[var(--shell)]">
            {ficha.eggs}{" "}
            <span className="text-[13px] font-normal text-[rgba(255,251,240,0.6)]">huevos</span>
          </div>
        </div>
        <div className="text-right">
          <div className="font-[var(--font-fraunces)] text-[24px] font-bold leading-none text-[var(--yolk)]">
            ${ficha.price}
          </div>
          <div className="mt-[3px] font-[var(--font-jetbrains-mono)] text-[9px] text-[rgba(255,251,240,0.6)]">
            {ficha.pricePer}
          </div>
        </div>
      </div>
    </div>
  );
}
