import type { ReactNode } from "react";

/**
 * A single comparison cell (one side of one criterion row).
 *
 * `text` is typed as `ReactNode` (not `string`) because the data is authored
 * as JSX so it can carry inline `<em>` emphasis without `dangerouslySetInnerHTML`.
 * The `numberAriaLabel` is optional and used when the visible `number` is a
 * non-semantic glyph (e.g. "?") that needs an accessible label.
 */
export interface ComparisonCell {
  number: string;
  unit: string;
  text: ReactNode;
  note: string;
  numberAriaLabel?: string;
}

export interface Criterion {
  id: string;
  /** Criterion name (e.g. "Crianza"). Shown as the desktop center pill and as
   *  the mobile per-cell label. */
  label: string;
  left: ComparisonCell;
  right: ComparisonCell;
}
