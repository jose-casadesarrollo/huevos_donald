"use client";

import { AgendaComposition } from "@/remotion/compositions/AgendaComposition";

import { VizPlayer } from "./VizPlayer";

const DAYS = ["L", "M", "M", "J", "V", "S", "D"];

function AgendaStatic() {
  return (
    <div className="flex h-full w-full flex-col justify-center gap-3.5 px-5">
      <div className="flex items-baseline justify-between">
        <span className="font-[var(--font-jetbrains-mono)] text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--ink-soft)]">
          Comuna
        </span>
        <span className="font-[var(--font-fraunces)] text-[18px] font-medium italic text-[var(--ink)]">
          Las Condes
        </span>
      </div>
      <div className="flex gap-1.5">
        {DAYS.map((d, i) => {
          const active = i === 2;
          return (
            <div
              key={i}
              className={`flex h-9 flex-1 items-center justify-center rounded-[9px] font-[var(--font-jetbrains-mono)] text-[12px] font-bold ${
                active
                  ? "bg-[var(--red)] text-[var(--shell)]"
                  : "border border-[rgba(34,26,15,0.08)] bg-[var(--shell)] text-[var(--ink-soft)]"
              }`}
            >
              {d}
            </div>
          );
        })}
      </div>
      <div className="flex items-center justify-between rounded-[10px] border border-[rgba(34,26,15,0.08)] bg-[var(--shell)] px-3 py-2.5">
        <span className="inline-flex items-center gap-2 font-[var(--font-jetbrains-mono)] text-[9px] font-bold uppercase tracking-[0.16em] text-[var(--ink-soft)]">
          <span className="h-[7px] w-[7px] rounded-full bg-[var(--moss)]" />
          Tu ventana
        </span>
        <span className="font-[var(--font-jetbrains-mono)] text-[13px] font-bold text-[var(--ink)]">09:00 — 12:00</span>
      </div>
    </div>
  );
}

export function AgendaViz() {
  return (
    <VizPlayer
      component={AgendaComposition}
      durationInFrames={180}
      fps={30}
      compositionWidth={400}
      compositionHeight={160}
      ariaLabel="Animación: calendario con día asignado"
      fallback={<AgendaStatic />}
    />
  );
}
