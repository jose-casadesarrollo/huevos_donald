"use client";

import { useState } from "react";

import type { ProductDetailContent } from "./types";

/**
 * Acordeón del detalle: Descripción (abierta por defecto), Trazabilidad y origen,
 * Conservación. Permite varios abiertos a la vez (estado local). El "+" rota 45°
 * para leerse como "×" al abrir.
 */
export function ProductAccordion({ content }: { content: ProductDetailContent }) {
  const items: { id: string; q: string; a: string }[] = [
    { id: "descripcion", q: "Descripción", a: content.description },
    { id: "trazabilidad", q: "Trazabilidad y origen", a: content.traceability },
    { id: "conservacion", q: "Conservación", a: content.storage },
  ];
  const [open, setOpen] = useState<Set<string>>(() => new Set(["descripcion"]));

  const toggle = (id: string) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <div className="mx-auto w-full max-w-[1240px]">
      <div className="overflow-hidden rounded-[18px] border border-[rgba(34,26,15,0.1)] bg-[var(--shell)]">
        {items.map((item, i) => {
          const isOpen = open.has(item.id);
          return (
            <div key={item.id} className={i > 0 ? "border-t border-[rgba(34,26,15,0.08)]" : ""}>
              <h3>
                <button
                  type="button"
                  id={`acc-${item.id}`}
                  aria-expanded={isOpen}
                  aria-controls={`panel-${item.id}`}
                  onClick={() => toggle(item.id)}
                  className="flex w-full items-center justify-between gap-4 px-5 py-5 text-left"
                >
                  <span className="font-[var(--font-fraunces)] text-[18px] font-medium text-[var(--ink)]">
                    {item.q}
                  </span>
                  <span
                    aria-hidden
                    className="flex size-7 shrink-0 items-center justify-center font-[var(--font-dm-sans)] text-[24px] font-light leading-none text-[var(--red)] transition-transform duration-300 motion-reduce:transition-none"
                    style={{ transform: isOpen ? "rotate(45deg)" : "rotate(0deg)" }}
                  >
                    +
                  </span>
                </button>
              </h3>
              <div
                id={`panel-${item.id}`}
                role="region"
                aria-labelledby={`acc-${item.id}`}
                hidden={!isOpen}
              >
                <p className="px-5 pb-6 font-[var(--font-dm-sans)] text-[15px] leading-[1.65] text-[var(--ink-soft)]">
                  {item.a}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
