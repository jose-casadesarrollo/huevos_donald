/** Pill con el código de lote — rojo translúcido, mono, levemente rotada. */
export function LoteBadge({ code }: { code: string }) {
  return (
    <span
      className="inline-block rounded-[5px] bg-[rgba(230,26,39,0.9)] px-2 py-[3px] font-[var(--font-jetbrains-mono)] text-[9px] font-bold uppercase tracking-[0.08em] text-[var(--shell)] shadow-[0_2px_8px_-2px_rgba(184,20,32,0.5)]"
      style={{ transform: "rotate(2deg)" }}
    >
      {code}
    </span>
  );
}
