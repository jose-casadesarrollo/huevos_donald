import { MetricCountUp } from "./MetricCountUp";
import { MetricIcon } from "./icons";
import type { Metric } from "./types";

/**
 * One impact metric: yolk icon chip, the count-up value (+ optional suffix), a
 * label, an honesty note, and the data-kind tag with a pulsing "live" dot. `run`
 * gates the count-up (turns true when the grid scrolls in). Presentational —
 * the dot pulse is the only motion and it's CSS, disabled under reduced motion.
 */
export function MetricCard({ metric, run }: { metric: Metric; run: boolean }) {
  return (
    <div className="group relative bg-[var(--ink)] px-7 py-9 transition-colors duration-300 hover:bg-[#2A2113]">
      {/* Icon chip */}
      <div className="flex size-10 items-center justify-center rounded-[10px] bg-[rgba(242,169,0,0.12)]">
        <MetricIcon icon={metric.icon} />
      </div>

      {/* Value (count-up) + suffix */}
      <div
        className="mt-5 flex items-baseline gap-1 font-[var(--font-fraunces)] font-bold leading-[0.95] text-[var(--shell)]"
        style={{ fontSize: "clamp(38px, 4.5vw, 52px)" }}
      >
        <MetricCountUp target={metric.target} format={metric.format} run={run} />
        {metric.suffix && (
          <span className="text-[0.5em] font-bold text-[var(--yolk)]">{metric.suffix}</span>
        )}
      </div>

      {/* Label */}
      <div className="mt-3 font-[var(--font-dm-sans)] text-[14px] font-semibold text-[rgba(255,251,240,0.85)]">
        {metric.label}
      </div>

      {/* Honesty note */}
      <p className="mt-1.5 font-[var(--font-dm-sans)] text-[11px] leading-[1.45] text-[rgba(255,251,240,0.55)]">
        {metric.note}
      </p>

      {/* Data-kind tag — key to the anti-greenwashing transparency */}
      <div className="mt-4 inline-flex items-center gap-1.5 font-[var(--font-jetbrains-mono)] text-[9px] font-bold uppercase tracking-[0.12em] text-[var(--moss-light)]">
        <span
          aria-hidden
          className="inline-block size-1.5 rounded-full bg-[var(--moss-light)] motion-safe:animate-pulse"
        />
        {metric.kind}
      </div>
    </div>
  );
}
