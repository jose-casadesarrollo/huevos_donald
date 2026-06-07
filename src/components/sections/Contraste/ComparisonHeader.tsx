/**
 * The two labeled column-heads sitting at the top of the comparison card:
 * left = "Sistema actual / Industrial y opaco" (desaturated gray, square icon),
 * right = "Huevos Donald / Local y transparente" (brand red, round icon).
 *
 * Grid of two equal columns on desktop; stacked on mobile with a divider
 * between the two heads. The small icons are pure CSS — no icon library.
 */
export function ComparisonHeader() {
  return (
    <div className="grid grid-cols-1 border-b border-[var(--ink)]/8 md:grid-cols-2">
      {/* Left column-head — Sistema actual */}
      <div className="border-b border-[var(--ink)]/8 bg-[rgba(138,129,117,0.05)] px-7 pt-[22px] pb-5 md:border-b-0">
        <div className="mb-2.5 flex items-center gap-2 font-[var(--font-jetbrains-mono)] text-[9px] font-bold uppercase tracking-[0.2em] text-[var(--gray-cold-deep)]">
          {/* Industrial: cold geometric square */}
          <span
            aria-hidden
            className="inline-block size-2 rounded-[2px] bg-[var(--gray-cold)] opacity-60"
          />
          Sistema actual
        </div>
        <h3
          className="mb-1 font-[var(--font-fraunces)] font-bold leading-[1.1] text-[var(--gray-cold-deep)]"
          style={{ fontSize: "clamp(18px, 1.9vw, 22px)" }}
        >
          Industrial y opaco
        </h3>
        <p className="font-[var(--font-dm-sans)] text-[12px] text-[var(--gray-cold)] md:text-[var(--ink-soft)]">
          El estándar de la góndola del supermercado.
        </p>
      </div>

      {/* Right column-head — Huevos Donald */}
      <div className="bg-[rgba(230,26,39,0.025)] px-7 pt-[22px] pb-5">
        <div className="mb-2.5 flex items-center gap-2 font-[var(--font-jetbrains-mono)] text-[9px] font-bold uppercase tracking-[0.2em] text-[var(--ink-soft)]">
          {/* Organic: living red dot with a soft halo */}
          <span
            aria-hidden
            className="inline-block size-2 rounded-full bg-[var(--red)] shadow-[0_0_0_3px_rgba(230,26,39,0.2)]"
          />
          Huevos Donald
        </div>
        <h3
          className="mb-1 font-[var(--font-fraunces)] font-bold leading-[1.1] text-[var(--ink)]"
          style={{ fontSize: "clamp(18px, 1.9vw, 22px)" }}
        >
          Local y{" "}
          <em className="font-medium italic text-[var(--red)]">transparente</em>
        </h3>
        <p className="font-[var(--font-dm-sans)] text-[12px] text-[var(--ink-soft)]">
          Lo que estamos construyendo para Chile.
        </p>
      </div>
    </div>
  );
}
