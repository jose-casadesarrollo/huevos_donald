"use client";

import { SaldoComposition } from "@/remotion/compositions/SaldoComposition";

import { VizPlayer } from "./VizPlayer";

/** Static representative frame for reduced-motion / SSR. */
function SaldoStatic() {
  return (
    <div className="flex h-full w-full flex-col justify-center gap-3 px-5">
      <span className="font-[var(--font-jetbrains-mono)] text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--ink-soft)]">
        Saldo disponible
      </span>
      <div className="flex items-baseline gap-2">
        <span className="font-[var(--font-fraunces)] text-[46px] font-bold leading-none text-[var(--ink)]">24</span>
        <span className="font-[var(--font-fraunces)] text-[20px] font-medium italic text-[var(--ink-soft)]">
          huevos
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-[rgba(34,26,15,0.08)]">
        <div className="h-full w-[60%] rounded-full bg-[linear-gradient(90deg,var(--yolk),var(--yolk-deep))]" />
      </div>
      <div className="flex items-center justify-between">
        <span className="font-[var(--font-jetbrains-mono)] text-[10px] text-[var(--ink-soft)]">
          Plan Familia · 36 al mes
        </span>
        <span className="inline-flex items-center gap-1.5 font-[var(--font-jetbrains-mono)] text-[10px] font-bold text-[var(--ink)]">
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--red)]" />+ 340 puntos
        </span>
      </div>
    </div>
  );
}

export function SaldoViz() {
  return (
    <VizPlayer
      component={SaldoComposition}
      durationInFrames={180}
      fps={30}
      compositionWidth={400}
      compositionHeight={160}
      ariaLabel="Animación: saldo de huevos consumiéndose"
      fallback={<SaldoStatic />}
    />
  );
}
