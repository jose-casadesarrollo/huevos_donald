"use client";

import { MetricCard } from "./MetricCard";
import { metrics } from "./data";
import { useInView } from "./useInView";

/**
 * The 4-metric grid. Owns the one-shot in-view trigger so every count-up fires
 * together when the grid scrolls in. The `gap-px` over the grid's light
 * background draws the hairline dividers between cells (each cell paints its own
 * ink background). 1 col (mobile) → 2 (≥560px) → 4 (≥940px).
 */
export function MetricsGrid() {
  const { ref, inView } = useInView<HTMLDivElement>(0.3);

  return (
    <div
      ref={ref}
      className="mb-12 grid grid-cols-1 gap-px overflow-hidden rounded-[20px] border border-[rgba(255,251,240,0.1)] bg-[rgba(255,251,240,0.1)] min-[560px]:grid-cols-2 min-[940px]:grid-cols-4"
    >
      {metrics.map((metric) => (
        <MetricCard key={metric.id} metric={metric} run={inView} />
      ))}
    </div>
  );
}
