import type { ReactNode } from "react";

import { Footer } from "@/components/landing/Footer";
import { Nav } from "@/components/landing/Nav";
import { ScanCorners } from "@/components/tienda/ScanCorners";
import { TIENDA_TOKENS } from "@/components/tienda/tokens";

const ACCENT: Record<"moss" | "yolk" | "red", string> = {
  moss: "var(--moss)",
  yolk: "var(--yolk-deep)",
  red: "var(--red)",
};

/** Centered confirmation card shared by the three /pago result pages. */
export function PagoShell({
  accent,
  eyebrow,
  title,
  children,
}: {
  accent: "moss" | "yolk" | "red";
  eyebrow: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <>
      <Nav />
      <main style={TIENDA_TOKENS} className="bg-background px-6 pb-[120px] pt-[140px]">
        <div className="relative mx-auto max-w-[560px] overflow-hidden rounded-[24px] border border-[rgba(34,26,15,0.1)] bg-[var(--shell)] p-8 text-center shadow-[0_24px_60px_-30px_rgba(34,26,15,0.3)]">
          <ScanCorners />
          <span
            className="font-[var(--font-jetbrains-mono)] text-[11px] font-bold uppercase tracking-[0.2em]"
            style={{ color: ACCENT[accent] }}
          >
            {eyebrow}
          </span>
          <h1 className="mt-3 font-[var(--font-fraunces)] text-[32px] font-bold leading-tight text-[var(--ink)]">
            {title}
          </h1>
          <div className="mt-4 font-[var(--font-dm-sans)] text-[15px] leading-[1.55] text-[var(--ink-soft)]">
            {children}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

export const PAGO_CTA =
  "mt-6 inline-flex items-center rounded-full bg-[var(--red)] px-6 py-3 font-[var(--font-dm-sans)] text-[15px] font-semibold text-[var(--shell)] shadow-[0_2px_0_var(--red-deep)] transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-[0_4px_0_var(--red-deep)] motion-reduce:transition-none";
