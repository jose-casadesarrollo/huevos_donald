import type { LoteInfo } from "./types";

/**
 * Ficha del lote, tipo certificado: cabecera (cream) con título + código en
 * rojo, y una grilla 2×2 con Origen, Productor, Calibre y Postura. Los textos
 * largos (origen/productor) van en variante `small`.
 */
export function LoteFicha({ lote }: { lote: LoteInfo }) {
  const rows: { label: string; value: string; small: boolean }[] = [
    { label: "Origen", value: lote.origin, small: true },
    { label: "Productor", value: lote.producer, small: true },
    { label: "Calibre", value: lote.caliber, small: false },
    { label: "Postura", value: lote.laid, small: false },
  ];

  return (
    <div className="overflow-hidden rounded-2xl border border-[rgba(34,26,15,0.12)] bg-[var(--shell)] shadow-[0_10px_30px_-20px_rgba(34,26,15,0.3)]">
      <div className="flex items-center justify-between gap-3 border-b border-[rgba(34,26,15,0.1)] bg-[var(--cream)] px-4 py-2.5">
        <span className="font-[var(--font-jetbrains-mono)] text-[9px] font-bold uppercase tracking-[0.16em] text-[var(--ink-soft)]">
          Ficha del lote
        </span>
        <span className="font-[var(--font-jetbrains-mono)] text-[11px] font-bold tracking-[0.04em] text-[var(--red)]">
          {lote.code}
        </span>
      </div>

      <dl className="grid grid-cols-2">
        {rows.map((row, i) => (
          <div
            key={row.label}
            className={`flex flex-col gap-1 px-4 py-3.5 ${
              i % 2 === 0 ? "border-r border-[rgba(34,26,15,0.08)]" : ""
            } ${i < 2 ? "border-b border-[rgba(34,26,15,0.08)]" : ""}`}
          >
            <dt className="font-[var(--font-jetbrains-mono)] text-[8px] font-bold uppercase tracking-[0.16em] text-[var(--ink-soft)]">
              {row.label}
            </dt>
            <dd
              className={`font-[var(--font-fraunces)] font-bold leading-tight text-[var(--ink)] ${
                row.small ? "text-[13px]" : "text-[15px]"
              }`}
            >
              {row.value}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
