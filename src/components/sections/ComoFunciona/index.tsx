import { ComoFuncionaHeader } from "./ComoFuncionaHeader";
import { StepCard } from "./StepCard";
import { VidaUtilCard } from "./VidaUtilCard";
import { sopFooter, steps } from "./data";

export type { StepData, StepTag, VizKind, LifecycleState, LifecycleNotif } from "./types";
export { steps, sopFooter, lifecycleStates, lifecycleNotifs } from "./data";

// Section-scoped palette tokens, injected inline so the section is
// self-contained (no globals.css edits) — mirrors the Trazabilidad / Contraste
// / Productores SECTION_TOKENS pattern.
const SECTION_TOKENS = {
  "--cream": "#F6EFDC",
  "--cream-deep": "#EFE5C9",
  "--ink": "#221A0F",
  "--ink-soft": "#4A3D2A",
  "--red": "#E61A27",
  "--red-deep": "#B81420",
  "--yolk": "#F2A900",
  "--yolk-deep": "#C97D00",
  "--shell": "#FFFBF0",
  "--moss": "#4A5D3A",
} as React.CSSProperties;

/**
 * "Cómo funciona" landing section (05). Three product-mechanic steps, each with
 * a looping Remotion mini-viz, followed by the full order-lifecycle timeline.
 * Server-rendered shell; the Remotion <Player> wrappers are the client islands.
 */
export function ComoFuncionaSection() {
  return (
    <section
      aria-labelledby="como-funciona-title"
      className="relative overflow-hidden bg-background px-6 py-[72px] text-[var(--ink)]"
      style={SECTION_TOKENS}
    >
      <div className="relative mx-auto max-w-[1280px]">
        <ComoFuncionaHeader />

        <div className="mb-16 grid grid-cols-1 gap-5 md:grid-cols-3 md:gap-6">
          {steps.map((step) => (
            <StepCard key={step.num} step={step} />
          ))}
        </div>

        <VidaUtilCard />

        <p className="mt-7 text-center font-[var(--font-jetbrains-mono)] text-[11px] tracking-[0.05em] text-[var(--ink-soft)] opacity-70">
          {sopFooter}
        </p>
      </div>
    </section>
  );
}
