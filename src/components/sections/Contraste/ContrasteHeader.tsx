/**
 * Centered section header for the Contraste section:
 * eyebrow ("03 / Contexto") flanked by two short red rules, an H2 display
 * heading, and a short intro paragraph. Purely presentational.
 */
export function ContrasteHeader() {
  return (
    <header className="mx-auto mb-9 flex max-w-[640px] flex-col items-center text-center">
      {/* Eyebrow with side rules */}
      <div className="flex items-center gap-3">
        <span aria-hidden className="inline-block h-px w-7 bg-[var(--red)]" />
        <span className="font-[var(--font-jetbrains-mono)] text-[11px] font-bold uppercase tracking-[0.2em]">
          <span className="text-[var(--ink-soft)]">03 /</span>{" "}
          <span className="text-[var(--red)]">Contexto</span>
        </span>
        <span aria-hidden className="inline-block h-px w-7 bg-[var(--red)]" />
      </div>

      {/* Heading */}
      <h2
        id="contraste-title"
        className="mt-5 font-[var(--font-fraunces)] font-bold leading-none tracking-tight text-[var(--ink)]"
        style={{ fontSize: "clamp(30px, 4.2vw, 48px)" }}
      >
        Dos formas de comer huevos
        <br />
        en Chile{" "}
        <em className="font-medium italic text-[var(--red)]">hoy.</em>
      </h2>

      {/* Intro */}
      <p className="mt-4 max-w-[540px] font-[var(--font-dm-sans)] text-[15px] leading-[1.5] text-[var(--ink-soft)]">
        No criticamos el sistema actual. Construimos uno mejor — más transparente, más
        local, más respetuoso con las gallinas y con tu mesa.
      </p>
    </header>
  );
}
