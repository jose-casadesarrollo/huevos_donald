import { LifecycleViz } from "./vizs/LifecycleViz";

/**
 * "La vida útil de un pedido" card — header + the full lifecycle timeline. The
 * timeline container is tall on mobile (vertical rail) and short on desktop
 * (horizontal track); LifecycleViz picks the matching composition by viewport.
 */
export function VidaUtilCard() {
  return (
    <div className="rounded-[20px] border border-[rgba(34,26,15,0.08)] bg-[var(--shell)] px-5 py-7 md:px-8 md:py-9">
      <div className="mx-auto max-w-[540px] text-center">
        <span className="font-[var(--font-jetbrains-mono)] text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--red)]">
          — En tiempo real —
        </span>
        <h3
          className="mt-2 font-[var(--font-fraunces)] font-bold leading-[1.05] text-[var(--ink)]"
          style={{ fontSize: "clamp(22px, 2.6vw, 30px)" }}
        >
          La vida útil de <em className="font-medium italic text-[var(--red)]">un pedido</em>
        </h3>
        <p className="mt-2 font-[var(--font-dm-sans)] text-[13px] leading-[1.5] text-[var(--ink-soft)]">
          Seguimiento de extremo a extremo. Cada estado se actualiza solo y te avisamos antes de que
          toquen el timbre.
        </p>
      </div>

      <div className="mt-7 h-[480px] md:h-[200px]">
        <LifecycleViz />
      </div>
    </div>
  );
}
