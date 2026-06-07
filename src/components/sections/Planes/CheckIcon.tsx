/**
 * Inline check mark, sized + colored via `className` (uses `currentColor`).
 * Reused by the plan feature lists and the benefits pill — decorative, so
 * `aria-hidden`.
 */
export function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" aria-hidden="true">
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
