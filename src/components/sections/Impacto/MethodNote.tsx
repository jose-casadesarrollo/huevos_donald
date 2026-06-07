import { METHODOLOGY_PATH } from "./data";

/**
 * Methodology footnote (anti-greenwashing / SERNAC). Splits the note around the
 * word "aquí" to render a real, navigable link to the methodology page.
 */
export function MethodNote({ note }: { note: string }) {
  const [before, after] = note.split("aquí");

  return (
    <p className="mx-auto mt-9 max-w-[640px] text-center font-[var(--font-jetbrains-mono)] text-[11px] leading-[1.5] tracking-[0.02em] text-[rgba(255,251,240,0.45)]">
      {before}
      <a
        href={METHODOLOGY_PATH}
        className="text-[rgba(255,251,240,0.65)] underline underline-offset-2"
      >
        aquí
      </a>
      {after}
    </p>
  );
}
