import { FrequencyToggle } from "./FrequencyToggle";
import type { Frequency } from "./types";

/**
 * Centered header for "06 / Planes": eyebrow with flanking rules, display H2,
 * the saldo intro, and the frequency toggle. Mirrors the ComoFunciona header so
 * the two sections read as a set.
 */
export function PlanesHeader({
  frequency,
  onFrequencyChange,
}: {
  frequency: Frequency;
  onFrequencyChange: (frequency: Frequency) => void;
}) {
  return (
    <header className="mx-auto mb-9 max-w-[680px] text-center">
      {/* Eyebrow with flanking rules */}
      <div className="mb-5 flex items-center justify-center gap-3">
        <span aria-hidden className="inline-block h-px w-7 bg-[var(--red)]" />
        <span className="font-[var(--font-jetbrains-mono)] text-[11px] font-bold uppercase tracking-[0.2em]">
          <span className="text-[var(--ink-soft)]">06 /</span>{" "}
          <span className="text-[var(--red)]">Planes</span>
        </span>
        <span aria-hidden className="inline-block h-px w-7 bg-[var(--red)]" />
      </div>

      <h2
        id="planes-title"
        className="font-[var(--font-fraunces)] font-bold leading-none tracking-[-0.025em] text-[var(--ink)]"
        style={{ fontSize: "clamp(34px, 4.8vw, 56px)" }}
      >
        Elige cuántos huevos
        <br />
        al mes <em className="font-medium italic text-[var(--red)]">quieres.</em>
      </h2>

      <p className="mx-auto mt-5 max-w-[480px] font-[var(--font-dm-sans)] text-[15px] leading-[1.5] text-[var(--ink-soft)]">
        Un saldo mensual de huevos que usas a tu ritmo. Sin contratos, sin amarres. Cambias o
        cancelas cuando quieras.
      </p>

      <FrequencyToggle value={frequency} onChange={onFrequencyChange} />
    </header>
  );
}
