/**
 * Centered header for "07 / Impacto colectivo" on the dark section: yolk eyebrow
 * with flanking rules, display H2, and a muted intro. Same eyebrow grammar as
 * the other sections, recolored for the black background (yolk reads brighter
 * than red here). Presentational.
 */
export function ImpactoHeader() {
  return (
    <header className="mx-auto mb-14 max-w-[720px] text-center">
      {/* Eyebrow with flanking rules */}
      <div className="mb-5 flex items-center justify-center gap-3">
        <span aria-hidden className="inline-block h-px w-7 bg-[var(--yolk)] opacity-60" />
        <span className="font-[var(--font-jetbrains-mono)] text-[11px] font-bold uppercase tracking-[0.2em]">
          <span className="text-[rgba(255,251,240,0.5)]">07 /</span>{" "}
          <span className="text-[var(--yolk)]">Impacto colectivo</span>
        </span>
        <span aria-hidden className="inline-block h-px w-7 bg-[var(--yolk)] opacity-60" />
      </div>

      <h2
        id="impacto-title"
        className="font-[var(--font-fraunces)] font-bold leading-[1.02] tracking-[-0.02em] text-[var(--shell)]"
        style={{ fontSize: "clamp(34px, 5vw, 60px)" }}
      >
        Sumándote, <em className="font-medium italic text-[var(--yolk)]">sumas</em>
        <br />
        a algo más grande.
      </h2>

      <p className="mx-auto mt-5 max-w-[520px] font-[var(--font-dm-sans)] text-[16px] leading-[1.5] text-[rgba(255,251,240,0.7)]">
        Cada suscripción mueve la aguja. Esto es lo que logramos juntos, actualizado al cierre del
        último mes.
      </p>
    </header>
  );
}
