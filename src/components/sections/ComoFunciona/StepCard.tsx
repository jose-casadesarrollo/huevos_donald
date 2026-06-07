import type { StepData, VizKind } from "./types";
import { AgendaViz } from "./vizs/AgendaViz";
import { NotifViz } from "./vizs/NotifViz";
import { SaldoViz } from "./vizs/SaldoViz";

const VIZ: Record<VizKind, () => React.JSX.Element> = {
  saldo: SaldoViz,
  agenda: AgendaViz,
  notif: NotifViz,
};

/**
 * A single "Cómo funciona" step: its Remotion mini-viz, a num·category row, the
 * title (with the emphasised word in italic red), description, and tag chips.
 * Server-rendered; the viz it hosts is the only client island.
 */
export function StepCard({ step }: { step: StepData }) {
  const Viz = VIZ[step.vizComponent];
  const [before, after] = step.title.split(step.titleEm);

  return (
    <article className="group relative overflow-hidden rounded-[20px] border border-[rgba(34,26,15,0.08)] bg-[var(--shell)] p-7 shadow-[0_1px_0_rgba(255,255,255,0.6)_inset,0_16px_30px_-16px_rgba(34,26,15,0.12)] transition-[transform,box-shadow] duration-300 ease-out hover:-translate-y-[3px] hover:shadow-[0_1px_0_rgba(255,255,255,0.6)_inset,0_22px_40px_-16px_rgba(34,26,15,0.16)]">
      {/* Mini-viz */}
      <div className="h-[160px] overflow-hidden rounded-[14px] bg-[var(--cream)]">
        <Viz />
      </div>

      {/* num · category */}
      <div className="mt-6 font-[var(--font-jetbrains-mono)] text-[11px] font-bold tracking-[0.18em]">
        <span className="text-[var(--red)]">{step.num}</span>
        <span className="text-[var(--ink-soft)]"> · {step.category}</span>
      </div>

      {/* title */}
      <h3
        className="mt-2 font-[var(--font-fraunces)] font-bold leading-[1.05] text-[var(--ink)]"
        style={{ fontSize: "clamp(22px, 2.2vw, 26px)" }}
      >
        {before}
        <em className="font-medium italic text-[var(--red)]">{step.titleEm}</em>
        {after}
      </h3>

      {/* description */}
      <p className="mt-2.5 font-[var(--font-dm-sans)] text-[14px] leading-[1.5] text-[var(--ink-soft)]">
        {step.desc}
      </p>

      {/* tags */}
      <div className="mt-5 flex flex-wrap gap-1.5 border-t border-dashed border-[rgba(34,26,15,0.12)] pt-4">
        {step.tags.map((tag) => (
          <span
            key={tag.label}
            className={`rounded-full px-2 py-1 font-[var(--font-jetbrains-mono)] text-[9px] font-bold uppercase tracking-[0.08em] ${
              tag.accent
                ? "bg-[rgba(230,26,39,0.05)] text-[var(--red)]"
                : "border border-[rgba(34,26,15,0.12)] text-[var(--ink-soft)]"
            }`}
          >
            {tag.label}
          </span>
        ))}
      </div>
    </article>
  );
}
