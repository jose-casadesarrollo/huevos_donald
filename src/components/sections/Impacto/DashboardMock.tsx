import type { DashboardData } from "./types";

/**
 * Mini preview of the user's future account dashboard. Static mockup on the
 * light shell card (tilted -1°, straightens on hover). All values come from
 * `data` (the example user). The balance bar width is the real used/total ratio.
 */
export function DashboardMock({ data }: { data: DashboardData }) {
  const pct = Math.round((data.balanceUsed / data.balanceTotal) * 100);

  return (
    <div className="rotate-[-1deg] rounded-2xl bg-[var(--shell)] p-5 text-[var(--ink)] shadow-[0_24px_50px_-16px_rgba(0,0,0,0.4)] transition-transform duration-[400ms] ease-out hover:rotate-0 motion-reduce:transition-none">
      {/* Header: avatar + name/plan + months badge */}
      <div className="flex items-center gap-3">
        <div className="flex size-9 items-center justify-center rounded-full bg-[var(--red)] font-[var(--font-fraunces)] text-[13px] font-bold text-[var(--shell)]">
          {data.userInitials}
        </div>
        <div className="leading-tight">
          <div className="font-[var(--font-fraunces)] text-[13px] font-bold">{data.userName}</div>
          <div className="font-[var(--font-dm-sans)] text-[10px] text-[var(--ink-soft)]">
            {data.userPlan}
          </div>
        </div>
        <span className="ml-auto rounded-full bg-[rgba(74,93,58,0.12)] px-2 py-1 font-[var(--font-jetbrains-mono)] text-[9px] font-bold uppercase tracking-[0.1em] text-[var(--moss)]">
          {data.monthsBadge}
        </span>
      </div>

      {/* Title */}
      <div className="mt-5 font-[var(--font-jetbrains-mono)] text-[9px] font-bold uppercase tracking-[0.15em] text-[var(--ink-soft)]">
        Tu impacto acumulado
      </div>

      {/* Two metric cells */}
      <div className="mt-2.5 grid grid-cols-2 gap-2.5">
        <div className="rounded-[10px] bg-[var(--cream)] p-3">
          <div className="font-[var(--font-fraunces)] text-[24px] font-bold leading-none text-[var(--red)]">
            {data.eggsReceived}
          </div>
          <div className="mt-1 font-[var(--font-dm-sans)] text-[11px] text-[var(--ink-soft)]">
            huevos recibidos
          </div>
        </div>
        <div className="rounded-[10px] bg-[var(--cream)] p-3">
          <div className="font-[var(--font-fraunces)] text-[24px] font-bold leading-none text-[var(--ink)]">
            {data.co2Saved}
            <span className="text-[14px]">kg</span>
          </div>
          <div className="mt-1 font-[var(--font-dm-sans)] text-[11px] text-[var(--ink-soft)]">
            CO₂ evitado
          </div>
        </div>
      </div>

      {/* Balance progress */}
      <div className="mt-2.5 rounded-[10px] bg-[var(--cream)] p-3">
        <div className="flex items-center justify-between">
          <span className="font-[var(--font-dm-sans)] text-[11px] font-medium text-[var(--ink-soft)]">
            Saldo del mes
          </span>
          <span className="font-[var(--font-jetbrains-mono)] text-[11px] font-bold text-[var(--red)]">
            {data.balanceUsed} / {data.balanceTotal}
          </span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-[rgba(34,26,15,0.08)]">
          <div
            className="h-full rounded-full bg-[linear-gradient(90deg,var(--moss),var(--moss-light))]"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    </div>
  );
}
