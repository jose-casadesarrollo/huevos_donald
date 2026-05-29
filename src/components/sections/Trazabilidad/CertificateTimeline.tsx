import type { TimelineStep } from "./types";

function StepDot({ step, index }: { step: TimelineStep; index: number }) {
  if (step.status === "done") {
    return (
      <div
        className="relative flex size-[18px] items-center justify-center rounded-full border-2 border-[var(--moss)] bg-[var(--moss)] text-[10px] leading-none text-white"
        aria-label="Completado"
      >
        ✓
      </div>
    );
  }

  if (step.status === "current") {
    return (
      <div className="relative flex size-[18px] items-center justify-center rounded-full border-2 border-[var(--red)] bg-[var(--red)] text-white shadow-[0_0_0_4px_rgba(230,26,39,0.15)]">
        <span aria-hidden className="text-[8px] leading-none">
          ●
        </span>
        <span
          aria-hidden
          className="traza-ping absolute inset-0 rounded-full border-2 border-[var(--red)]"
          style={{ animation: "traza-ping 2s infinite" }}
        />
        <span className="sr-only">En progreso</span>
      </div>
    );
  }

  // pending
  return (
    <div
      className="relative flex size-[18px] items-center justify-center rounded-full border-2 border-[var(--ink)]/20 bg-[var(--cream-deep)] font-[var(--font-jetbrains-mono)] text-[9px] font-bold text-[var(--ink-soft)]"
      aria-label="Pendiente"
    >
      {index + 1}
    </div>
  );
}

function connectorClasses(prevDone: boolean) {
  return prevDone ? "bg-[var(--moss)]/40" : "bg-[var(--ink)]/15";
}

export function CertificateTimeline({ steps }: { steps: TimelineStep[] }) {
  return (
    <div>
      <div className="mb-3 font-[var(--font-jetbrains-mono)] text-[9px] font-medium uppercase tracking-[0.15em] text-[var(--ink-soft)]">
        Ruta del lote
      </div>

      {/* Mobile: vertical timeline */}
      <ol
        aria-label="Ruta del lote"
        className="flex flex-col sm:hidden"
      >
        {steps.map((step, i) => (
          <li key={step.label} className="flex items-stretch gap-3">
            <div className="flex w-[18px] flex-col items-center">
              <StepDot step={step} index={i} />
              {i < steps.length - 1 && (
                <div className={`my-1 w-px flex-1 ${connectorClasses(step.status === "done")}`} />
              )}
            </div>
            <div className={`min-w-0 flex-1 ${i < steps.length - 1 ? "pb-4" : ""}`}>
              <div className="font-[var(--font-dm-sans)] text-[12px] font-bold leading-tight text-[var(--ink)]">
                {step.label}
              </div>
              <div className="mt-0.5 font-[var(--font-jetbrains-mono)] text-[10px] font-medium leading-tight text-[var(--ink-soft)]">
                {step.time}
              </div>
            </div>
          </li>
        ))}
      </ol>

      {/* sm+: horizontal timeline */}
      <ol
        aria-label="Ruta del lote"
        className="hidden sm:flex sm:items-start"
      >
        {steps.map((step, i) => (
          <li key={step.label} className="relative flex flex-1 flex-col items-center gap-1.5">
            <div className="relative flex w-full justify-center">
              {i > 0 && (
                <div
                  className={[
                    "absolute left-0 right-1/2 top-[9px] h-px -translate-y-1/2",
                    connectorClasses(steps[i - 1].status === "done"),
                  ].join(" ")}
                />
              )}
              {i < steps.length - 1 && (
                <div
                  className={[
                    "absolute left-1/2 right-0 top-[9px] h-px -translate-y-1/2",
                    connectorClasses(step.status === "done"),
                  ].join(" ")}
                />
              )}
              <div className="relative">
                <StepDot step={step} index={i} />
              </div>
            </div>
            <div className="whitespace-nowrap text-center">
              <div className="font-[var(--font-dm-sans)] text-[11px] font-bold leading-tight text-[var(--ink)]">
                {step.label}
              </div>
              <div className="font-[var(--font-jetbrains-mono)] text-[9px] font-medium leading-tight text-[var(--ink-soft)]">
                {step.time}
              </div>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
