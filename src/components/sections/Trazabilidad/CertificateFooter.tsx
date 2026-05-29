import type { Lote } from "./types";

/**
 * Bottom strip of the certificate: stamp + tagline on the left,
 * producer signature on the right. Mirror of the header's double rule
 * (1px + 2px, 6px apart) above the row.
 */
export function CertificateFooter({ lote }: { lote: Lote }) {
  return (
    <div
      className={[
        "relative mt-6 flex flex-col gap-6 pt-6",
        "sm:flex-row sm:items-center sm:justify-between",
        "border-t-2 border-[var(--ink)]",
        // Second hairline rule sitting 6px above the main border
        "before:absolute before:left-0 before:right-0 before:bottom-[calc(100%+6px)]",
        "before:h-px before:bg-[var(--ink)] before:content-['']",
      ].join(" ")}
    >
      {/* Left — stamp + tagline */}
      <div className="flex items-center gap-4">
        <div
          aria-hidden
          className="flex size-14 rotate-[-8deg] items-center justify-center rounded-full border-[1.5px] border-[var(--red)] text-[var(--red)] opacity-85"
        >
          <div className="text-center font-[var(--font-fraunces)] text-[9px] font-bold italic uppercase leading-[1.05]">
            Certificado
            <br />
            Huevos
            <br />
            Donald
          </div>
        </div>
        <div className="max-w-[160px]">
          <strong className="block font-[var(--font-fraunces)] text-[14px] font-bold leading-tight text-[var(--ink)]">
            Sin intermediarios
          </strong>
          <span className="font-[var(--font-dm-sans)] text-[11px] font-medium leading-snug text-[var(--ink-soft)]">
            Del productor a tu mesa en menos de 48h.
          </span>
        </div>
      </div>

      {/* Right — signature */}
      <div className="text-left sm:text-right">
        <div
          aria-hidden
          className="inline-block rotate-[-3deg] font-[var(--font-fraunces)] text-[24px] font-medium italic leading-none text-[var(--ink)]"
        >
          {lote.productor.firmaCorta}
        </div>
        <div className="mt-2 font-[var(--font-jetbrains-mono)] text-[9px] font-medium uppercase tracking-[0.15em] text-[var(--ink-soft)]">
          Productor · Firma
        </div>
      </div>
    </div>
  );
}
