import { CertificateData } from "./CertificateData";
import { CertificateFooter } from "./CertificateFooter";
import { CertificateHeader } from "./CertificateHeader";
import { CertificateTimeline } from "./CertificateTimeline";
import { QRCode } from "./QRCode";
import type { Lote } from "./types";

const PAPER_BG =
  "radial-gradient(ellipse at top, rgba(242,169,0,0.04), transparent 60%), linear-gradient(180deg, var(--shell), var(--shell))";

const PAPER_SHADOW = [
  "inset 0 1px 0 rgba(255,255,255,0.6)",
  "0 40px 80px -20px rgba(34,26,15,0.22)",
  "0 12px 24px -12px rgba(34,26,15,0.12)",
].join(", ");

export function Certificate({ lote }: { lote: Lote }) {
  return (
    <div className="relative">
      {/* VERIFICADO sticker — overlaps the top-right corner */}
      <div
        className={[
          "absolute right-4 top-[-12px] z-10 rotate-2 select-none",
          "rounded-md bg-[var(--red)] px-3 py-2",
          "font-[var(--font-jetbrains-mono)] text-[10px] font-bold uppercase tracking-[0.15em] text-[var(--shell)]",
          "shadow-[0_6px_20px_rgba(230,26,39,0.35)]",
          "sm:right-8 sm:top-[-16px] sm:px-4 sm:py-[9px]",
        ].join(" ")}
      >
        <span aria-hidden className="mr-1.5">
          ✓
        </span>
        Verificado
      </div>

      {/* Paper card */}
      <article
        aria-label={`Ficha de trazabilidad del lote ${lote.id}`}
        className={[
          "traza-cert relative overflow-hidden rounded-sm border border-[var(--ink)]/[0.08]",
          "p-5 md:px-10 md:py-9",
          // Rotation only on md+ AND when motion is allowed
          "transition-transform duration-500 ease-out",
          "motion-safe:md:-rotate-[0.8deg] motion-safe:md:hover:-translate-y-1 motion-safe:md:hover:rotate-0",
          // Decorative corners (top-left, bottom-right)
          "before:pointer-events-none before:absolute before:left-3 before:top-3 before:size-5 before:border-l-2 before:border-t-2 before:border-[var(--ink)]/25 before:content-['']",
          "after:pointer-events-none after:absolute after:bottom-3 after:right-3 after:size-5 after:border-b-2 after:border-r-2 after:border-[var(--ink)]/25 after:content-['']",
        ].join(" ")}
        style={{
          background: PAPER_BG,
          boxShadow: PAPER_SHADOW,
        }}
      >
        <CertificateHeader />

        {/* Lote identifier */}
        <div className="mt-8">
          <div className="font-[var(--font-jetbrains-mono)] text-[9px] font-medium uppercase tracking-[0.15em] text-[var(--ink-soft)]">
            Identificador de lote
          </div>
          <div className="mt-1.5 font-[var(--font-jetbrains-mono)] text-[22px] font-bold leading-none text-[var(--ink)] sm:text-[28px]">
            {lote.displayId.prefix}
            <span className="text-[var(--red)]">·</span>
            {lote.displayId.number}
            <span className="text-[var(--red)]">·</span>
            {lote.displayId.suffix}
          </div>
          <div className="mt-2 font-[var(--font-dm-sans)] text-[13px] font-medium text-[var(--ink-soft)]">
            {lote.caja}
          </div>
        </div>

        {/* QR + Datos */}
        <div className="mt-7 flex flex-col items-center gap-7 border-b border-dashed border-[var(--ink)]/20 pb-7 sm:flex-row sm:items-start sm:gap-7">
          <QRCode />
          <CertificateData lote={lote} />
        </div>

        {/* Timeline */}
        <div className="mt-6">
          <CertificateTimeline steps={lote.timeline} />
        </div>

        <CertificateFooter lote={lote} />
      </article>
    </div>
  );
}
