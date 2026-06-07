import { Card } from "@heroui/react";

import { ComparisonFooter } from "./ComparisonFooter";
import { ComparisonHeader } from "./ComparisonHeader";
import { ComparisonRow } from "./ComparisonRow";
import { criterios } from "./data";

/**
 * The full comparison card: column-heads + criteria rows + closing footer.
 *
 * Built on the HeroUI `Card` primitive (variant="transparent" to drop its
 * default surface background/shadow) and re-themed to the section's exact
 * shell color, border, radius and layered shadow. Padding is zeroed so the
 * header / rows / footer can run full-bleed to the card edges.
 *
 * The rows live in a 2-column grid exposed as an ARIA table; each
 * ComparisonRow uses `display: contents` so its two cells slot directly into
 * the grid (no `<table>`, to avoid the display:contents table-rendering bug).
 */
export function ComparisonCard() {
  return (
    <Card
      variant="transparent"
      className={[
        "mx-auto max-w-[896px] gap-0 overflow-hidden rounded-[24px] border border-[var(--ink)]/8 bg-[var(--shell)] p-0",
        "shadow-[0_1px_0_rgba(255,255,255,0.6)_inset,0_30px_60px_-20px_rgba(34,26,15,0.15),0_8px_20px_-10px_rgba(34,26,15,0.08)]",
      ].join(" ")}
    >
      <ComparisonHeader />

      <div
        role="table"
        aria-label="Comparación entre sistema actual y Huevos Donald"
        className="grid grid-cols-1 md:grid-cols-2"
      >
        {criterios.map((criterion, index) => (
          <ComparisonRow
            key={criterion.id}
            criterion={criterion}
            isLast={index === criterios.length - 1}
          />
        ))}
      </div>

      <ComparisonFooter />
    </Card>
  );
}
