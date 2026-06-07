import { NetworkCounter } from "./NetworkCounter";
import type { RedStats } from "./types";

/**
 * Two-column section header: eyebrow + display H2 on the left, the animated
 * network counter (productores · regiones · intermediarios) on the right.
 * Server-rendered; the counter delegates to a client child for the count-up.
 */
export function ProductoresHeader({ stats }: { stats: RedStats }) {
  return (
    <header className="mb-6 grid items-end gap-6 md:mb-9 md:grid-cols-[1fr_auto] md:gap-11">
      {/* Left — eyebrow + heading */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <span aria-hidden className="inline-block h-px w-7 bg-[var(--red)]" />
          <span className="font-[var(--font-jetbrains-mono)] text-[11px] font-bold uppercase tracking-[0.2em]">
            <span className="text-[var(--ink-soft)]">04 /</span>{" "}
            <span className="text-[var(--red)]">Nuestra red</span>
          </span>
        </div>
        <h2
          id="productores-title"
          className="font-[var(--font-fraunces)] font-bold leading-[0.98] tracking-[-0.025em] text-[var(--ink)]"
          style={{ fontSize: "clamp(28px, 4.4vw, 51px)" }}
        >
          Quienes lo
          <br />
          hacen <em className="font-medium italic text-[var(--red)]">posible.</em>
        </h2>
      </div>

      {/* Right — animated network counter */}
      <NetworkCounter stats={stats} />
    </header>
  );
}
