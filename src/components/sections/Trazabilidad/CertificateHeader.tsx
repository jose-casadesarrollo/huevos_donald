/**
 * Top strip of the certificate: brand mark on the left, document type on
 * the right, with a "double rule" underline (2px + 1px, separated by 6px)
 * that mimics an official document.
 */
export function CertificateHeader() {
  return (
    <div
      className={[
        "relative flex items-start justify-between gap-6 pb-3",
        "border-b-2 border-[var(--ink)]",
        // Second hairline rule sitting 6px below the main border
        "after:absolute after:left-0 after:right-0 after:top-[calc(100%+6px)]",
        "after:h-px after:bg-[var(--ink)] after:content-['']",
      ].join(" ")}
    >
      <div className="flex items-center gap-3">
        <span
          aria-hidden
          className="inline-block size-2.5 rounded-full bg-[var(--red)] shadow-[0_0_0_2px_var(--shell),0_0_0_3px_var(--ink)]"
        />
        <span className="font-[var(--font-fraunces)] text-[20px] font-bold leading-none tracking-tight text-[var(--ink)]">
          Huevos Donald
        </span>
      </div>

      <div className="text-right">
        <div className="font-[var(--font-jetbrains-mono)] text-[9px] font-medium uppercase tracking-[0.15em] text-[var(--ink-soft)]">
          Documento
        </div>
        <div className="font-[var(--font-fraunces)] text-[15px] font-medium italic text-[var(--ink)]">
          Ficha de trazabilidad
        </div>
      </div>
    </div>
  );
}
