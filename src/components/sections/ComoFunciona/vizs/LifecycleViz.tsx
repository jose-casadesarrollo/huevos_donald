"use client";

import {
  LifecycleHorizontal,
  LifecycleVertical,
} from "@/remotion/compositions/LifecycleComposition";
import { Bell, Check } from "@/remotion/components/icons";

import { lifecycleNotifs, lifecycleStates } from "../data";
import type { LifecycleState } from "../types";
import { useMediaQuery } from "../useMediaQuery";
import { VizPlayer } from "./VizPlayer";

function StaticDot({ state, size = 28 }: { state: LifecycleState; size?: number }) {
  const isDone = state.status === "done";
  const isCurrent = state.status === "current";
  const bg = isDone ? "var(--moss)" : isCurrent ? "var(--red)" : "var(--cream-deep)";
  return (
    <div className="relative" style={{ width: size, height: size }}>
      {isCurrent && (
        <div
          className="absolute inset-0 rounded-full border-2 border-[var(--red)] opacity-30"
          style={{ transform: "scale(1.5)" }}
        />
      )}
      <div
        className="relative flex items-center justify-center rounded-full"
        style={{
          width: size,
          height: size,
          backgroundColor: bg,
          border: state.status === "pending" ? "1px solid rgba(34,26,15,0.20)" : "none",
        }}
      >
        {isDone && <Check color="var(--shell)" size={size * 0.5} />}
        {isCurrent && (
          <span
            className="rounded-full bg-[var(--shell)]"
            style={{ width: size * 0.3, height: size * 0.3 }}
          />
        )}
      </div>
    </div>
  );
}

/** Responsive static frame: horizontal track on desktop, vertical rail on mobile. */
function LifecycleStatic() {
  return (
    <div className="h-full w-full">
      {/* Desktop — horizontal track */}
      <div className="relative hidden h-full w-full flex-col justify-center md:flex">
        {/* Notif markers */}
        <div className="relative mx-[6%] mb-2 h-9">
          {lifecycleNotifs.map((n) => (
            <div
              key={n.label}
              className="absolute -translate-x-1/2"
              style={{ left: `${n.position}%` }}
            >
              <div className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-[var(--red)] px-2.5 py-1">
                <Bell color="var(--shell)" size={11} />
                <span className="font-[var(--font-jetbrains-mono)] text-[8px] font-bold tracking-[0.1em] text-[var(--shell)]">
                  {n.label}
                </span>
              </div>
              <div
                className="absolute left-1/2 -translate-x-1/2"
                style={{
                  bottom: -5,
                  width: 0,
                  height: 0,
                  borderLeft: "5px solid transparent",
                  borderRight: "5px solid transparent",
                  borderTop: "6px solid var(--red)",
                }}
              />
            </div>
          ))}
        </div>

        {/* Track + dots */}
        <div className="relative mx-[6%]">
          <div className="absolute left-[48px] right-[48px] top-[14px] h-px bg-[rgba(34,26,15,0.10)]" />
          <div className="absolute left-[48px] top-[13px] h-[3px] w-[55%] rounded-full bg-[linear-gradient(90deg,var(--moss),var(--red))]" />
          <div className="relative flex justify-between">
            {lifecycleStates.map((s) => (
              <div key={s.num} className="flex flex-col items-center" style={{ width: 96 }}>
                <StaticDot state={s} />
                <div className="mt-2 text-center">
                  <div className="font-[var(--font-jetbrains-mono)] text-[10px] font-bold text-[var(--ink-soft)]">
                    {s.num}
                  </div>
                  <div
                    className={`mt-0.5 font-[var(--font-fraunces)] text-[12px] font-bold leading-[1.15] ${
                      s.status === "current" ? "text-[var(--red)]" : "text-[var(--ink)]"
                    }`}
                  >
                    {s.label}
                  </div>
                  <div className="mt-0.5 font-[var(--font-jetbrains-mono)] text-[9px] text-[var(--ink-soft)]">
                    {s.time}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Mobile — vertical rail */}
      <div className="relative h-full w-full md:hidden">
        <div className="absolute bottom-3 top-3 left-[27px] border-l-2 border-dashed border-[rgba(34,26,15,0.18)]" />
        <div className="flex h-full flex-col justify-between py-1">
          {lifecycleStates.map((s) => (
            <div key={s.num} className="flex items-center gap-3.5">
              <div className="flex w-[56px] shrink-0 justify-center">
                <StaticDot state={s} size={26} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-2">
                  <span className="font-[var(--font-jetbrains-mono)] text-[10px] font-bold text-[var(--ink-soft)]">
                    {s.num}
                  </span>
                  <span
                    className={`font-[var(--font-fraunces)] text-[16px] font-bold ${
                      s.status === "current" ? "text-[var(--red)]" : "text-[var(--ink)]"
                    }`}
                  >
                    {s.label}
                  </span>
                </div>
                <div className="mt-0.5 font-[var(--font-jetbrains-mono)] text-[10px] text-[var(--ink-soft)]">
                  {s.time}
                </div>
                {s.status === "current" && (
                  <div className="mt-0.5 font-[var(--font-jetbrains-mono)] text-[10px] font-bold text-[var(--red)]">
                    Notif · 20 min y 5 min
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function LifecycleViz() {
  const isDesktop = useMediaQuery("(min-width: 768px)");

  return isDesktop ? (
    <VizPlayer
      component={LifecycleHorizontal}
      durationInFrames={300}
      fps={30}
      compositionWidth={1080}
      compositionHeight={220}
      ariaLabel="Timeline animado del ciclo de un pedido"
      fallback={<LifecycleStatic />}
    />
  ) : (
    <VizPlayer
      component={LifecycleVertical}
      durationInFrames={300}
      fps={30}
      compositionWidth={400}
      compositionHeight={480}
      ariaLabel="Timeline animado del ciclo de un pedido"
      fallback={<LifecycleStatic />}
    />
  );
}
