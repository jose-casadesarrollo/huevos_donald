import type { Lote } from "./lotes.data";

const MONO = { fontFamily: "var(--font-jetbrains-mono), monospace" } as const;
const FRAUNCES = { fontFamily: "var(--font-fraunces), serif" } as const;

interface SlotProps {
  lote: Lote;
  active: boolean;
}

// Stacked slots swap instantly — no enter/exit animation. The active slot is
// shown, the rest hidden, the moment the index changes. Only the map animates.
function slotClasses(active: boolean) {
  return `absolute inset-0 ${
    active ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
  }`;
}

function LoteIdDisplay({ id }: { id: string }) {
  const parts = id.split("-");
  return (
    <>
      {parts.map((part, i) => (
        <span key={`${part}-${i}`}>
          {i > 0 && <span className="text-[var(--red)]">·</span>}
          {part}
        </span>
      ))}
    </>
  );
}

export function LoteHeaderSlot({ lote, active }: SlotProps) {
  return (
    <div aria-hidden={!active} className={slotClasses(active)}>
      {/* Sticker — peeks above the shell card */}
      <div
        className="absolute -top-[14px] right-2 select-none rounded-md bg-[var(--red)] px-3.5 py-2 text-[10px] font-bold tracking-[0.12em] text-[var(--shell)] rotate-3"
        style={{ ...MONO, boxShadow: "0 4px 12px rgba(230, 26, 39, 0.3)" }}
      >
        {lote.sticker}
      </div>

      <header className="flex items-start justify-between">
        <div>
          <div
            className="text-[10px] uppercase tracking-[0.22em] font-bold text-[var(--ink-soft)]"
            style={MONO}
          >
            LOTE
          </div>
          <div
            className="mt-1 text-[22px] font-bold text-[var(--ink)] leading-none"
            style={MONO}
          >
            <LoteIdDisplay id={lote.id} />
          </div>
        </div>
        <div className="inline-flex items-center gap-1.5 rounded-full bg-[rgba(74,93,58,0.12)] px-2.5 py-1">
          <span className="relative inline-flex size-2">
            <span className="absolute inset-0 rounded-full bg-[var(--moss)] animate-ping opacity-60" />
            <span className="relative inline-flex size-2 rounded-full bg-[var(--moss)]" />
          </span>
          <span
            className="text-[10px] font-bold tracking-[0.12em] text-[var(--moss)]"
            style={MONO}
          >
            {lote.status}
          </span>
        </div>
      </header>
    </div>
  );
}

export function LoteDataSlot({ lote, active }: SlotProps) {
  return (
    <div aria-hidden={!active} className={slotClasses(active)}>
      <div className="grid grid-cols-2 gap-2.5">
        <div className="rounded-[10px] border border-[rgba(34,26,15,0.05)] bg-[var(--cream)] px-3.5 py-3">
          <div
            className="text-[9px] uppercase tracking-[0.18em] font-bold text-[var(--ink-soft)]"
            style={MONO}
          >
            PRODUCTOR
          </div>
          <div
            className="mt-1.5 text-base font-bold text-[var(--ink)] leading-tight"
            style={FRAUNCES}
          >
            {lote.productor}
          </div>
          <div
            className="mt-0.5 text-[11px] text-[var(--ink-soft)]"
            style={MONO}
          >
            {lote.granja}
          </div>
        </div>
        <div className="rounded-[10px] border border-[rgba(34,26,15,0.05)] bg-[var(--cream)] px-3.5 py-3">
          <div
            className="text-[9px] uppercase tracking-[0.18em] font-bold text-[var(--ink-soft)]"
            style={MONO}
          >
            POSTURA
          </div>
          <div
            className="mt-1.5 text-base font-bold text-[var(--ink)] leading-tight"
            style={MONO}
          >
            {lote.postura}
          </div>
          <div
            className="mt-0.5 text-[11px] text-[var(--ink-soft)]"
            style={MONO}
          >
            Lote del día
          </div>
        </div>
      </div>
    </div>
  );
}
