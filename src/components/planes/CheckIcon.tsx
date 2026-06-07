/**
 * Inline check mark, sized + colored via `className` (uses `currentColor`).
 * Reused by the plan include lists and the comparison table — decorative by
 * default; pass an `aria-label` (e.g. "Incluido") where the check carries meaning
 * for screen readers, as in the compare table.
 */
export function CheckIcon({
  className,
  label,
}: {
  className?: string;
  label?: string;
}) {
  return (
    <svg
      className={className}
      viewBox="0 0 16 16"
      fill="none"
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      <path
        d="M3 8.5l3.5 3.5L13 5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
