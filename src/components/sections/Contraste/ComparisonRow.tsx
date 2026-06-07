import { Chip } from "@heroui/react";

import type { ComparisonCell, Criterion } from "./types";

interface ComparisonRowProps {
  criterion: Criterion;
  /** True for the final criterion — drops the trailing border on both layouts. */
  isLast: boolean;
}

interface CellProps {
  side: "left" | "right";
  /** Criterion name — shown as the mobile per-cell label and (left only) the desktop center pill. */
  label: string;
  cell: ComparisonCell;
  isLast: boolean;
}

/**
 * A single comparison cell, laid out as two columns:
 *  - left column  → the `text` (title) on top, the `note` (content) underneath
 *  - right column → the `number` as a big bold stat, with `unit` as a caption
 *
 * The "Sistema actual" (left) side stays in desaturated cold-gray; the "Huevos
 * Donald" (right) side uses the brand red for its number and `<em>` emphasis.
 */
function Cell({ side, label, cell, isLast }: CellProps) {
  const isLeft = side === "left";

  const cellBase = "relative px-6 py-4 md:px-7 md:py-4";

  // Border pattern:
  //  - desktop: every cell has a 1px bottom hairline; last row drops it.
  //  - mobile: pairs are grouped — left cell has no bottom border, the right
  //    cell carries a 2px border; both dropped on the last row.
  const border = isLeft
    ? isLast
      ? "md:border-b-0"
      : "md:border-b md:border-[var(--ink)]/6"
    : isLast
      ? "border-b-0 md:border-b-0"
      : "border-b-2 border-[var(--ink)]/12 md:border-b md:border-[var(--ink)]/6";

  return (
    <div
      role="cell"
      className={[
        cellBase,
        border,
        isLeft
          ? "bg-[rgba(138,129,117,0.03)] text-[var(--gray-cold-deep)]"
          : [
              "bg-transparent text-[var(--ink)]",
              // Vertical divider between the columns (desktop only).
              "md:before:absolute md:before:inset-y-0 md:before:left-0 md:before:w-px",
              "md:before:bg-[var(--ink)]/8 md:before:content-['']",
            ].join(" "),
      ].join(" ")}
    >
      {/* Mobile-only criterion label with the side prefix */}
      <p className="mb-2.5 font-[var(--font-jetbrains-mono)] text-[9px] font-bold uppercase tracking-[0.18em] text-[var(--ink-soft)] md:hidden">
        <span className={isLeft ? "text-[var(--gray-cold)]" : "text-[var(--red)]"}>
          {isLeft ? "Sistema actual · " : "Huevos Donald · "}
        </span>
        {label}
      </p>

      {/* Two-column body: 40% number / 60% title+content. Both columns are a
          fixed fraction of the cell, so every title starts at the same x
          (40% line) regardless of number/unit length. The number column's
          pr-[32px] supplies the gap, so the two columns sum to exactly 100%. */}
      <div className="flex items-start">
        {/* Number column — 40% — big bold number with its unit caption. */}
        <div className="w-2/5 shrink-0 pl-[30px] pr-[32px] text-left">
          <span
            className={[
              "block font-[var(--font-fraunces)] font-bold leading-none tracking-[-0.02em]",
              isLeft ? "text-[var(--gray-cold-deep)]" : "text-[var(--red)]",
            ].join(" ")}
            style={{ fontSize: "clamp(26px, 2.8vw, 34px)" }}
            aria-label={cell.numberAriaLabel}
          >
            {cell.number}
          </span>
          <span
            className={[
              "mt-1 block font-[var(--font-dm-sans)] text-[11px] font-medium leading-[1.2]",
              isLeft ? "text-[var(--gray-cold)]" : "text-[var(--ink-soft)]",
            ].join(" ")}
          >
            {cell.unit}
          </span>
        </div>

        {/* Title/content column — 60% — title on top, content underneath */}
        <div className="w-3/5 min-w-0">
          <p
            className={[
              "mb-1 font-[var(--font-fraunces)] text-[15px] font-medium leading-[1.25]",
              isLeft
                ? "text-[var(--gray-cold-deep)] opacity-85"
                : "text-[var(--ink)] [&_em]:italic [&_em]:text-[var(--red)]",
            ].join(" ")}
          >
            {cell.text}
          </p>
          <p
            className={[
              "font-[var(--font-dm-sans)] text-[12px] leading-[1.35]",
              isLeft ? "text-[var(--gray-cold)]" : "text-[var(--ink-soft)] opacity-80",
            ].join(" ")}
          >
            {cell.note}
          </p>
        </div>
      </div>

      {/* Desktop-only center pill (left cell only), straddling the divider. */}
      {isLeft && (
        <Chip
          aria-hidden
          variant="secondary"
          className={[
            "pointer-events-none absolute top-1/2 left-full z-[2] hidden -translate-x-1/2",
            "-translate-y-1/2 whitespace-nowrap rounded-full border border-[var(--ink)]/10",
            "bg-[var(--shell)] px-3 py-[5px] font-[var(--font-jetbrains-mono)] text-[9px]",
            "font-bold uppercase tracking-[0.15em] text-[var(--ink-soft)] md:inline-flex",
          ].join(" ")}
        >
          <Chip.Label className="px-0">{label}</Chip.Label>
        </Chip>
      )}
    </div>
  );
}

/**
 * One comparison row = a left (Sistema actual) cell + a right (Huevos Donald)
 * cell. Uses `display: contents` so both cells participate directly in the
 * parent `.comp-rows` 2-column grid (per the spec; no `<table>` to avoid the
 * `display:contents` table bug). The wrapper carries `role="row"`.
 */
export function ComparisonRow({ criterion, isLast }: ComparisonRowProps) {
  const { label, left, right } = criterion;

  return (
    <div role="row" className="contents">
      <Cell side="left" label={label} cell={left} isLast={isLast} />
      <Cell side="right" label={label} cell={right} isLast={isLast} />
    </div>
  );
}
