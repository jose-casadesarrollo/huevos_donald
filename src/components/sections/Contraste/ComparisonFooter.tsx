/**
 * The black closing footer of the comparison card. Carries a subtle diagonal
 * texture (via a ::before repeating-linear-gradient), a yolk-colored eyebrow
 * flanked by short rules, the anchor quote with yolk accents, and a muted sub.
 */
export function ComparisonFooter() {
  return (
    <div
      className={[
        "relative overflow-hidden bg-[var(--ink)] px-6 py-6 text-center text-[var(--shell)]",
        "md:px-9 md:py-[26px]",
        // Diagonal hairline texture.
        "before:pointer-events-none before:absolute before:inset-0 before:content-['']",
        "before:bg-[repeating-linear-gradient(135deg,transparent_0,transparent_40px,rgba(255,251,240,0.02)_40px,rgba(255,251,240,0.02)_41px)]",
      ].join(" ")}
    >
      <div className="relative">
        {/* Eyebrow with side rules */}
        <div className="flex items-center justify-center gap-3">
          <span
            aria-hidden
            className="inline-block h-px w-[18px] bg-[var(--yolk)] opacity-50"
          />
          <span className="font-[var(--font-jetbrains-mono)] text-[9px] font-bold uppercase tracking-[0.2em] text-[var(--yolk)]">
            El punto
          </span>
          <span
            aria-hidden
            className="inline-block h-px w-[18px] bg-[var(--yolk)] opacity-50"
          />
        </div>

        {/* Anchor quote */}
        <p
          className="mx-auto mt-2.5 max-w-[720px] font-[var(--font-fraunces)] font-medium italic leading-[1.2] tracking-[-0.02em]"
          style={{ fontSize: "clamp(18px, 2.2vw, 24px)" }}
        >
          No es <span className="text-[var(--yolk)]">contra ellos.</span>
          <br />
          Es <span className="text-[var(--yolk)]">a favor tuyo.</span>
        </p>

        {/* Sub */}
        <p className="mt-1.5 font-[var(--font-dm-sans)] text-[12px] text-[rgba(255,251,240,0.6)]">
          Construimos lo que nos gustaría comprar. Punto.
        </p>
      </div>
    </div>
  );
}
