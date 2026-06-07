"use client";

import { NotifComposition } from "@/remotion/compositions/NotifComposition";
import { Bell } from "@/remotion/components/icons";

import { VizPlayer } from "./VizPlayer";

function NotifStatic() {
  return (
    <div className="flex h-full w-full items-center px-5">
      <div className="flex w-full items-center gap-3 rounded-[14px] border border-[rgba(34,26,15,0.08)] bg-[var(--shell)] px-3.5 py-3 shadow-[0_14px_28px_-16px_rgba(34,26,15,0.30)]">
        <div className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-[11px] bg-[var(--cream)]">
          <Bell color="var(--ink)" size={18} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-[var(--font-fraunces)] text-[13px] font-bold leading-[1.1] text-[var(--ink)]">
            Tu pedido está en camino
          </div>
          <div className="mt-0.5 font-[var(--font-dm-sans)] text-[11px] text-[var(--ink-soft)]">
            Llegará en aprox. 20 minutos
          </div>
        </div>
        <span className="shrink-0 font-[var(--font-jetbrains-mono)] text-[12px] font-bold text-[var(--red)]">20m</span>
      </div>
    </div>
  );
}

export function NotifViz() {
  return (
    <VizPlayer
      component={NotifComposition}
      durationInFrames={150}
      fps={30}
      compositionWidth={400}
      compositionHeight={160}
      ariaLabel="Animación: notificaciones de entrega"
      fallback={<NotifStatic />}
    />
  );
}
