import type { Lote } from "./types";

interface DataRowProps {
  label: string;
  value: string;
  detail: string;
  isLast?: boolean;
}

function DataRow({ label, value, detail, isLast }: DataRowProps) {
  return (
    <div
      className={[
        "grid grid-cols-[78px_1fr] items-baseline gap-3 py-3 sm:grid-cols-[100px_1fr]",
        isLast ? "" : "border-b border-[var(--ink)]/[0.06]",
      ].join(" ")}
    >
      <div className="font-[var(--font-jetbrains-mono)] text-[10px] font-medium uppercase tracking-[0.15em] text-[var(--ink-soft)]">
        {label}
      </div>
      <div className="min-w-0">
        <div className="font-[var(--font-fraunces)] text-[15px] font-bold leading-tight text-[var(--ink)] sm:text-[16px]">
          {value}
        </div>
        <div className="mt-0.5 block font-[var(--font-dm-sans)] text-[12px] font-medium leading-snug text-[var(--ink-soft)]">
          {detail}
        </div>
      </div>
    </div>
  );
}

export function CertificateData({ lote }: { lote: Lote }) {
  const rows: DataRowProps[] = [
    { label: "Productor", value: lote.productor.nombre, detail: lote.productor.granja },
    { label: "Crianza", value: lote.crianza.tipo, detail: lote.crianza.detalle },
    { label: "Alimentación", value: lote.alimentacion.tipo, detail: lote.alimentacion.detalle },
    { label: "Postura", value: lote.postura.fecha, detail: lote.postura.relativo },
    { label: "Recorrido", value: lote.recorrido.resumen, detail: lote.recorrido.detalle },
  ];

  return (
    <div className="w-full min-w-0 sm:flex-1">
      {rows.map((r, i) => (
        <DataRow key={r.label} {...r} isLast={i === rows.length - 1} />
      ))}
    </div>
  );
}
