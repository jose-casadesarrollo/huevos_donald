"use client";

import type { Frequency } from "./types";

const OPTIONS: { value: Frequency; label: string; badge?: string }[] = [
  { value: "mensual", label: "Mensual" },
  { value: "trimestral", label: "Trimestral", badge: "AHORRA 15%" },
];

/**
 * Controlled frequency switch (mensual / trimestral). A red pill slides under
 * the active option. The two options live in an equal 2-column grid (both tracks
 * size to the wider option, so the seam sits at exactly 50%), which lets the
 * slider be positioned with pure percentages — no JS measurement, and so immune
 * to the section's `zoom` de-scale. Exposed as an ARIA tablist with ←/→ support.
 */
export function FrequencyToggle({
  value,
  onChange,
}: {
  value: Frequency;
  onChange: (frequency: Frequency) => void;
}) {
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (["ArrowRight", "ArrowLeft", "Home", "End"].includes(event.key)) {
      event.preventDefault();
      onChange(value === "mensual" ? "trimestral" : "mensual");
    }
  };

  // 5px = the container's padding inset; 2px = half the 4px column gap, so the
  // slider's inner edge lands exactly on the seam between the two columns.
  const sliderPos =
    value === "mensual" ? "left-[5px] right-[calc(50%+2px)]" : "left-[calc(50%+2px)] right-[5px]";

  return (
    <div
      role="tablist"
      aria-label="Frecuencia de facturación"
      className="relative mt-7 inline-grid grid-cols-2 items-center gap-1 rounded-full border border-[rgba(34,26,15,0.1)] bg-[var(--shell)] p-[5px]"
    >
      <span
        aria-hidden
        className={`pointer-events-none absolute bottom-[5px] top-[5px] rounded-full bg-[var(--red)] shadow-[0_2px_8px_rgba(230,26,39,0.3)] transition-[left,right] duration-[350ms] ease-[cubic-bezier(0.4,0,0.2,1)] motion-reduce:transition-none ${sliderPos}`}
      />

      {OPTIONS.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            role="tab"
            aria-selected={active}
            tabIndex={active ? 0 : -1}
            onClick={() => onChange(opt.value)}
            onKeyDown={handleKeyDown}
            className={`relative z-[2] inline-flex items-center justify-center gap-2 rounded-full px-[22px] py-2.5 font-[var(--font-dm-sans)] text-[14px] font-semibold transition-colors duration-200 ${
              active ? "text-[var(--shell)]" : "text-[var(--ink-soft)]"
            }`}
          >
            {opt.label}
            {opt.badge && (
              <span
                className={`rounded-full px-1.5 py-0.5 font-[var(--font-jetbrains-mono)] text-[9px] font-bold leading-none tracking-[0.04em] transition-colors ${
                  active
                    ? "bg-[rgba(255,251,240,0.25)] text-[var(--shell)]"
                    : "bg-[rgba(74,93,58,0.15)] text-[var(--moss)]"
                }`}
              >
                {opt.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
