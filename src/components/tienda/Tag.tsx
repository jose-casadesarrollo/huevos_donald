import type { ReactNode } from "react";

/** Pill mono pequeña (Calibre, Free range) sobre superficies claras. */
export function Tag({ children }: { children: ReactNode }) {
  return (
    <span className="inline-block rounded-full border border-[rgba(34,26,15,0.1)] bg-[var(--cream)] px-2.5 py-1 font-[var(--font-jetbrains-mono)] text-[8px] font-bold uppercase tracking-[0.1em] text-[var(--ink-soft)]">
      {children}
    </span>
  );
}
