import { CheckIcon } from "./CheckIcon";
import { compareFeatures, compareHead, planHref } from "./data";
import type { CompareValue } from "./types";

const PLAN_IDS = ["esencial", "familia", "cocinero"] as const;
const HL = "bg-[rgba(230,26,39,0.04)]"; // Familia column highlight

/** Render a single comparison cell value. `familia` reddens the text variant. */
function Value({ value, familia }: { value: CompareValue; familia: boolean }) {
  if (value.type === "check") {
    return (
      <CheckIcon
        className="mx-auto size-[18px] text-[var(--moss)]"
        label="Incluido"
      />
    );
  }
  if (value.type === "none") {
    return (
      <span className="text-[18px] text-[rgba(34,26,15,0.25)]" aria-label="No incluido">
        —
      </span>
    );
  }
  return (
    <span
      className={`font-[var(--font-fraunces)] text-[15px] font-bold ${
        familia ? "text-[var(--red)]" : "text-[var(--ink)]"
      }`}
    >
      {value.text}
    </span>
  );
}

/**
 * Block 4 — the comparison table (light background). A semantic `<table>` (column
 * widths via `<colgroup>`, the Familia column tinted by a `<col>` element) so
 * screen readers get real row/column headers; the checks carry "Incluido" /
 * "No incluido" labels. Wrapped in a horizontal scroller on `<720px` with a
 * swipe hint.
 */
export function CompareTable() {
  return (
    <section
      id="comparar"
      aria-labelledby="comparar-title"
      className="bg-background px-6 py-[88px] text-[var(--ink)]"
    >
      <div className="mx-auto max-w-[1080px]">
        {/* Header */}
        <header className="mb-10 text-center">
          <div className="flex items-center justify-center gap-3">
            <span aria-hidden className="inline-block h-px w-7 bg-[var(--red)]" />
            <span className="font-[var(--font-jetbrains-mono)] text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--red)]">
              Comparar planes
            </span>
            <span aria-hidden className="inline-block h-px w-7 bg-[var(--red)]" />
          </div>
          <h2
            id="comparar-title"
            className="mt-4 font-[var(--font-fraunces)] font-bold leading-[1.05] tracking-tight"
            style={{ fontSize: "clamp(30px, 4.4vw, 50px)" }}
          >
            Todo lo que incluye cada uno.
          </h2>
        </header>

        {/* Swipe hint — small screens only */}
        <p className="mb-3 text-center font-[var(--font-jetbrains-mono)] text-[10px] font-bold uppercase tracking-[0.15em] text-[var(--ink-soft)] min-[720px]:hidden">
          ← Desliza para ver toda la tabla →
        </p>

        {/* Scroll container keeps the rounded clip while allowing overflow on mobile */}
        <div className="overflow-x-auto">
          <div className="min-w-[640px] overflow-hidden rounded-[22px] border border-[rgba(34,26,15,0.1)] bg-[var(--shell)] shadow-[0_20px_50px_-28px_rgba(34,26,15,0.3)]">
            <table className="w-full table-fixed border-collapse">
              <colgroup>
                <col style={{ width: "31%" }} />
                <col style={{ width: "23%" }} />
                <col style={{ width: "23%" }} className={HL} />
                <col style={{ width: "23%" }} />
              </colgroup>

              <thead>
                <tr>
                  <th
                    scope="col"
                    className="bg-[var(--cream)] px-5 py-5 text-left align-bottom font-[var(--font-jetbrains-mono)] text-[10px] font-bold uppercase tracking-[0.15em] text-[var(--ink-soft)]"
                  >
                    Características
                  </th>
                  {compareHead.map((col, i) => {
                    const familia = i === 1;
                    return (
                      <th
                        scope="col"
                        key={col.name}
                        className="bg-[var(--cream)] px-3 py-5 text-center align-bottom"
                      >
                        {col.badge && (
                          <span className="mb-2 inline-block rounded-full bg-[var(--red)] px-2.5 py-1 font-[var(--font-jetbrains-mono)] text-[9px] font-bold uppercase tracking-[0.08em] text-[var(--shell)]">
                            {col.badge}
                          </span>
                        )}
                        <div
                          className={`font-[var(--font-fraunces)] text-[19px] font-bold italic ${
                            familia ? "text-[var(--red)]" : "text-[var(--ink)]"
                          }`}
                        >
                          {col.name}
                        </div>
                        <div className="mt-1 font-[var(--font-jetbrains-mono)] text-[12px] text-[var(--ink-soft)]">
                          {col.price}
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>

              <tbody>
                {compareFeatures.map((feature) => (
                  <tr key={feature.name}>
                    <th
                      scope="row"
                      className="border-t border-[rgba(34,26,15,0.08)] px-5 py-3.5 text-left font-[var(--font-dm-sans)] text-[14px] font-semibold text-[var(--ink)]"
                    >
                      {feature.name}
                    </th>
                    {feature.values.map((value, i) => (
                      <td
                        key={i}
                        className="border-t border-[rgba(34,26,15,0.08)] px-3 py-3.5 text-center"
                      >
                        <Value value={value} familia={i === 1} />
                      </td>
                    ))}
                  </tr>
                ))}

                {/* CTA row */}
                <tr>
                  <td className="border-t border-[rgba(34,26,15,0.1)] px-5 py-5" />
                  {PLAN_IDS.map((id, i) => {
                    const primary = i === 1;
                    return (
                      <td
                        key={id}
                        className="border-t border-[rgba(34,26,15,0.1)] px-3 py-5 text-center align-middle"
                      >
                        <a
                          href={planHref(id)}
                          className={`inline-flex items-center justify-center rounded-full px-4 py-2.5 font-[var(--font-dm-sans)] text-[13px] font-semibold transition-colors duration-200 motion-reduce:transition-none ${
                            primary
                              ? "bg-[var(--red)] text-[var(--shell)] shadow-[0_2px_0_var(--red-deep)] hover:bg-[var(--red-deep)]"
                              : "border border-[rgba(34,26,15,0.25)] text-[var(--ink)] hover:border-[var(--ink)] hover:bg-[var(--cream)]"
                          }`}
                        >
                          Elegir
                        </a>
                      </td>
                    );
                  })}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}
