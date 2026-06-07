"use client";

import { useId, useState } from "react";

import { planesFaq } from "./data";

const BTN_RED =
  "inline-flex items-center gap-2 rounded-full bg-[var(--red)] px-8 py-4 font-[var(--font-dm-sans)] text-[16px] font-semibold text-[var(--shell)] shadow-[0_2px_0_var(--red-deep)] transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-[0_4px_0_var(--red-deep)] motion-reduce:transition-none";

/** A single FAQ row — its panel height animates via the 0fr→1fr grid trick. */
function FaqRow({
  item,
  open,
  onToggle,
}: {
  item: { q: string; a: string };
  open: boolean;
  onToggle: () => void;
}) {
  const panelId = useId();

  return (
    <div className="border-b border-[rgba(34,26,15,0.12)]">
      <h3>
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={open}
          aria-controls={panelId}
          className="flex w-full items-center justify-between gap-4 py-5 text-left"
        >
          <span className="font-[var(--font-fraunces)] text-[18px] font-medium text-[var(--ink)]">
            {item.q}
          </span>
          <span
            aria-hidden
            className={`shrink-0 font-[var(--font-fraunces)] text-[26px] leading-none text-[var(--red)] transition-transform duration-300 ease-out motion-reduce:transition-none ${
              open ? "rotate-45" : ""
            }`}
          >
            +
          </span>
        </button>
      </h3>
      <div
        id={panelId}
        className="grid transition-[grid-template-rows] duration-300 ease-out motion-reduce:transition-none"
        style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          <p className="pb-5 pr-8 font-[var(--font-dm-sans)] text-[15px] leading-[1.6] text-[var(--ink-soft)]">
            {item.a}
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * Block 5 — the closing CTA over a `--cream-deep` background, followed by the
 * plan FAQ. Single-open accordion (one row at a time); the panel height and the
 * "+"→"×" toggle both animate, and both respect reduced motion. Client component
 * for the open-state toggle.
 */
export function FinalCta() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section
      aria-labelledby="planes-cta-title"
      className="bg-[var(--cream-deep)] px-6 py-[88px] text-[var(--ink)]"
    >
      <div className="mx-auto max-w-[760px]">
        {/* CTA */}
        <div className="text-center">
          <h2
            id="planes-cta-title"
            className="font-[var(--font-fraunces)] font-bold leading-[1.05] tracking-tight"
            style={{ fontSize: "clamp(34px, 5vw, 58px)" }}
          >
            ¿Listo para huevos <em className="font-medium italic text-[var(--red)]">de verdad?</em>
          </h2>
          <p className="mx-auto mt-5 max-w-[520px] font-[var(--font-dm-sans)] text-[17px] leading-[1.55] text-[var(--ink-soft)]">
            Elige tu plan, recibe tu primera caja esta semana y prueba la diferencia. Sin contratos:
            pausa o cancela cuando quieras.
          </p>
          <div className="mt-8">
            <a href="#planes-detalle" className={BTN_RED}>
              Empezar mi suscripción
              <span aria-hidden>→</span>
            </a>
          </div>
        </div>

        {/* FAQ */}
        <div className="mt-16">
          <div className="mb-6 text-center font-[var(--font-jetbrains-mono)] text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--ink-soft)]">
            Preguntas sobre los planes
          </div>
          <div className="border-t border-[rgba(34,26,15,0.12)]">
            {planesFaq.map((item, i) => (
              <FaqRow
                key={item.q}
                item={item}
                open={openIndex === i}
                onToggle={() => setOpenIndex((cur) => (cur === i ? null : i))}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
