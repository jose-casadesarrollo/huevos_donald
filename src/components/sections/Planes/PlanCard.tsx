import { CheckIcon } from "./CheckIcon";
import { checkoutHref } from "./data";
import type { Frequency, Plan } from "./types";

const SHELL_70 = "rgba(255,251,240,0.7)";
const SHELL_60 = "rgba(255,251,240,0.6)";
const SHELL_88 = "rgba(255,251,240,0.88)";

/**
 * A single subscription plan. Pure presentational — the parent owns the toggle
 * state and the price cross-fade, passing `displayed` (which frequency's price to
 * render) and `fading` (mid-swap opacity). `frequency` is the *selected* value,
 * used for the checkout href so the CTA reflects the choice instantly. The
 * `featured` plan flips to the dark variant and, on desktop, scales up + overlaps
 * its neighbours via the border/scale rules below + the grid in `index.tsx`.
 */
export function PlanCard({
  plan,
  frequency,
  displayed,
  fading,
}: {
  plan: Plan;
  frequency: Frequency;
  displayed: Frequency;
  fading: boolean;
}) {
  const featured = plan.featured;
  const isTri = displayed === "trimestral";
  const price = isTri ? plan.pricing.trimestral : plan.pricing.mensual;
  const period = isTri ? "al mes · facturado cada 3 meses" : `al mes · ${plan.eggs} huevos`;
  const fadeStyle = { opacity: fading ? 0 : 1 } as const;

  const cardClass = featured
    ? "group relative z-[3] flex flex-col rounded-[22px] bg-[var(--ink)] px-7 py-8 text-[var(--shell)] shadow-[0_30px_60px_-20px_rgba(34,26,15,0.3),0_10px_25px_-10px_rgba(34,26,15,0.2)] transition-[transform,box-shadow] duration-300 ease-out motion-reduce:transition-none max-[859px]:hover:-translate-y-[3px] min-[860px]:-my-2 min-[860px]:scale-[1.05] min-[860px]:hover:-translate-y-1"
    : "group relative flex flex-col rounded-[22px] border border-[rgba(34,26,15,0.1)] bg-[var(--shell)] px-7 py-8 transition-[transform,box-shadow] duration-300 ease-out hover:-translate-y-[3px] motion-reduce:transition-none min-[860px]:rounded-none min-[860px]:border-r-0 min-[860px]:first:rounded-l-[22px] min-[860px]:last:rounded-r-[22px] min-[860px]:last:border-r";

  const ctaClass = featured
    ? "bg-[var(--yolk)] text-[var(--ink)] shadow-[0_2px_0_var(--yolk-deep)] hover:-translate-y-px hover:shadow-[0_3px_0_var(--yolk-deep)] active:translate-y-px active:shadow-[0_1px_0_var(--yolk-deep)]"
    : "border border-[rgba(34,26,15,0.25)] text-[var(--ink)] hover:border-[var(--ink)] hover:bg-[var(--cream)]";

  return (
    <article className={cardClass}>
      {featured && plan.badge && (
        <span className="absolute -top-[13px] left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-[var(--red)] px-3 py-1 font-[var(--font-jetbrains-mono)] text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--shell)]">
          {plan.badge}
        </span>
      )}

      {/* Name */}
      <h3
        className={`font-[var(--font-fraunces)] text-[22px] font-medium italic ${
          featured ? "text-[var(--yolk)]" : "text-[var(--ink)]"
        }`}
      >
        {plan.name}
      </h3>

      {/* Tagline — min-height keeps prices aligned across the row */}
      <p
        className="mt-1 min-h-[36px] font-[var(--font-dm-sans)] text-[13px] leading-[1.4]"
        style={{ color: featured ? SHELL_70 : "var(--ink-soft)" }}
      >
        {plan.tagline}
      </p>

      {/* Price */}
      <div
        className="mt-2 flex items-baseline gap-1 transition-opacity duration-150 motion-reduce:transition-none"
        style={fadeStyle}
      >
        <span
          className={`font-[var(--font-fraunces)] text-[22px] font-bold leading-none ${
            featured ? "text-[var(--shell)]" : "text-[var(--ink)]"
          }`}
        >
          $
        </span>
        <span
          className={`font-[var(--font-fraunces)] text-[52px] font-bold leading-none tracking-[-0.03em] ${
            featured ? "text-[var(--shell)]" : "text-[var(--ink)]"
          }`}
        >
          {price}
        </span>
      </div>

      {/* Period */}
      <div
        className="mt-1.5 font-[var(--font-dm-sans)] text-[13px] transition-opacity duration-150 motion-reduce:transition-none"
        style={{ ...fadeStyle, color: featured ? SHELL_60 : "var(--ink-soft)" }}
      >
        {period}
      </div>

      {/* Savings — reserved height so the row never jumps on toggle */}
      <div className="mt-2 h-[26px]">
        {isTri && (
          <span
            className={`inline-block rounded-full px-2.5 py-1 font-[var(--font-jetbrains-mono)] text-[10px] font-bold transition-opacity duration-150 motion-reduce:transition-none ${
              featured
                ? "bg-[rgba(242,169,0,0.15)] text-[var(--yolk)]"
                : "bg-[rgba(74,93,58,0.1)] text-[var(--moss)]"
            }`}
            style={fadeStyle}
          >
            {plan.pricing.savingsLabel}
          </span>
        )}
      </div>

      {/* Eggs block */}
      <div
        className="mt-5 flex items-center gap-3 border-y border-dashed py-4"
        style={{ borderColor: featured ? "rgba(255,251,240,0.2)" : "rgba(34,26,15,0.12)" }}
      >
        <span
          className={`font-[var(--font-fraunces)] text-[28px] font-bold leading-none ${
            featured ? "text-[var(--yolk)]" : "text-[var(--red)]"
          }`}
        >
          {plan.eggs}
        </span>
        <div className="leading-tight">
          <div
            className={`font-[var(--font-dm-sans)] text-[13px] font-bold ${
              featured ? "text-[var(--shell)]" : "text-[var(--ink)]"
            }`}
          >
            huevos al mes
          </div>
          <div
            className="font-[var(--font-dm-sans)] text-[12px]"
            style={{ color: featured ? SHELL_60 : "var(--ink-soft)" }}
          >
            {plan.eggsNote}
          </div>
        </div>
      </div>

      {/* Features — flex-1 pushes the CTA to the bottom */}
      <ul className="mt-5 flex flex-1 flex-col gap-2.5">
        {plan.features.map((feature) => (
          <li key={feature} className="flex items-start gap-2.5">
            <CheckIcon
              className={`mt-0.5 size-4 shrink-0 ${featured ? "text-[var(--yolk)]" : "text-[var(--moss)]"}`}
            />
            <span
              className="font-[var(--font-dm-sans)] text-[14px] leading-[1.4]"
              style={{ color: featured ? SHELL_88 : "var(--ink-soft)" }}
            >
              {feature}
            </span>
          </li>
        ))}
      </ul>

      {/* CTA — carries plan + frequency into the checkout handoff */}
      <a
        href={checkoutHref(plan.id, frequency)}
        className={`mt-7 inline-flex w-full items-center justify-center rounded-full px-4 py-[15px] font-[var(--font-dm-sans)] text-[15px] font-semibold transition-[transform,background-color,border-color,box-shadow,color] duration-200 motion-reduce:transition-none ${ctaClass}`}
      >
        {plan.ctaLabel}
      </a>
    </article>
  );
}
