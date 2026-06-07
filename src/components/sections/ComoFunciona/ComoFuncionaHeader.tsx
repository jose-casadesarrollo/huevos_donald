/**
 * Centered section header for "05 / Cómo funciona": eyebrow with flanking
 * rules, display H2, and a short intro. Server-rendered — no interactivity.
 */
export function ComoFuncionaHeader() {
  return (
    <header className="mx-auto mb-12 max-w-[760px] text-center">
      {/* Eyebrow with flanking rules */}
      <div className="mb-5 flex items-center justify-center gap-3">
        <span aria-hidden className="inline-block h-px w-7 bg-[var(--red)]" />
        <span className="font-[var(--font-jetbrains-mono)] text-[11px] font-bold uppercase tracking-[0.2em]">
          <span className="text-[var(--ink-soft)]">05 /</span>{" "}
          <span className="text-[var(--red)]">Cómo funciona</span>
        </span>
        <span aria-hidden className="inline-block h-px w-7 bg-[var(--red)]" />
      </div>

      <h2
        id="como-funciona-title"
        className="font-[var(--font-fraunces)] font-bold leading-none tracking-[-0.025em] text-[var(--ink)]"
        style={{ fontSize: "clamp(34px, 4.8vw, 56px)" }}
      >
        Tres pasos. Y te <em className="font-medium italic text-[var(--red)]">olvidas</em>
        <br />
        de comprar huevos.
      </h2>

      <p className="mx-auto mt-5 max-w-[480px] font-[var(--font-dm-sans)] text-[15px] leading-[1.5] text-[var(--ink-soft)]">
        Desde que eliges tu plan hasta que el repartidor toca tu puerta. Así es como funciona Donald,
        paso por paso.
      </p>
    </header>
  );
}
