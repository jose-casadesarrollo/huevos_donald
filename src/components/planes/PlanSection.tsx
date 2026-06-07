import Image from "next/image";

import { CheckIcon } from "./CheckIcon";
import { FichaCard } from "./FichaCard";
import { MediaPlaceholder } from "./MediaPlaceholder";
import { ScanCorners } from "./ScanCorners";
import { MEDIA_READY, planHref } from "./data";
import type { PlanFull } from "./types";

const BTN_RED =
  "inline-flex items-center gap-1.5 self-start rounded-full bg-[var(--red)] px-7 py-3.5 font-[var(--font-dm-sans)] text-[15px] font-semibold text-[var(--shell)] shadow-[0_2px_0_var(--red-deep)] transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-[0_4px_0_var(--red-deep)] motion-reduce:transition-none";

/**
 * Block 2 — one zigzag plan section. Rendered three times (Esencial, Familia,
 * Cocinero). The content column carries the tag, heading, "for who", include
 * list, price and CTA; the media column is a tall photo with scan corners and the
 * consolidated <FichaCard> pinned to the bottom.
 *
 * Layout: single column on mobile (media first, then content), two columns on
 * `≥880px`. `reverse` flips the columns on desktop only — the alternation is
 * applied here, not via `nth-child`, since the page interleaves other blocks.
 * `darkBg` paints the `--cream-deep` background (the Familia plan).
 */
export function PlanSection({ plan, id }: { plan: PlanFull; id?: string }) {
  const { media } = plan;

  // Mobile: media first (order-1), content second. Desktop: `reverse` decides.
  const contentOrder = plan.reverse
    ? "order-2 min-[880px]:order-2"
    : "order-2 min-[880px]:order-1";
  const mediaOrder = plan.reverse
    ? "order-1 min-[880px]:order-1"
    : "order-1 min-[880px]:order-2";

  return (
    <section
      id={id}
      aria-labelledby={`plan-${plan.id}-title`}
      className={`relative overflow-hidden px-6 py-[72px] text-[var(--ink)] md:py-[88px] ${
        plan.darkBg ? "bg-[var(--cream-deep)]" : "bg-background"
      }`}
    >
      {/* Subtle background plan number (detail, not a watermark) */}
      <span
        aria-hidden
        className="pointer-events-none absolute right-8 top-10 z-0 select-none font-[var(--font-fraunces)] font-bold leading-none text-[var(--ink)] opacity-[0.06]"
        style={{ fontSize: "clamp(56px, 9vw, 80px)" }}
      >
        {plan.num}
      </span>

      <div className="relative z-[1] mx-auto grid max-w-[1180px] grid-cols-1 items-center gap-12 min-[880px]:grid-cols-2 min-[880px]:gap-[72px]">
        {/* Content */}
        <div className={`flex flex-col gap-5 ${contentOrder}`}>
          <div className="flex items-center gap-2.5">
            <span aria-hidden className="inline-block size-[7px] rounded-full bg-[var(--red)]" />
            <span className="font-[var(--font-jetbrains-mono)] text-[11px] font-bold uppercase tracking-[0.2em]">
              <span className="text-[var(--ink-soft)]">PLAN {plan.num} /</span>{" "}
              <span className="text-[var(--red)]">{plan.tagLabel}</span>
            </span>
          </div>

          <h2
            id={`plan-${plan.id}-title`}
            className="font-[var(--font-fraunces)] font-bold leading-[1.0] tracking-tight"
            style={{ fontSize: "clamp(36px, 4.8vw, 56px)" }}
          >
            {plan.name}
          </h2>

          <p className="font-[var(--font-fraunces)] text-[17px] font-medium italic text-[var(--ink-soft)]">
            {plan.forWho}
          </p>

          <ul className="flex flex-col">
            {plan.includes.map((item, i) => (
              <li
                key={item}
                className={`flex items-start gap-3 py-3 ${
                  i > 0 ? "border-t border-[rgba(34,26,15,0.1)]" : ""
                }`}
              >
                <CheckIcon className="mt-0.5 size-[18px] shrink-0 text-[var(--moss)]" />
                <span className="font-[var(--font-dm-sans)] text-[15px] leading-[1.45] text-[var(--ink-soft)]">
                  {item}
                </span>
              </li>
            ))}
          </ul>

          {/* Price */}
          <div className="flex items-end gap-3">
            <div className="flex items-start gap-1">
              <span className="mt-1.5 font-[var(--font-fraunces)] text-[24px] font-bold leading-none text-[var(--ink)]">
                $
              </span>
              <span className="font-[var(--font-fraunces)] text-[50px] font-bold leading-[0.9] tracking-[-0.03em] text-[var(--ink)]">
                {plan.price}
              </span>
            </div>
            <div className="pb-1 leading-tight">
              <div className="font-[var(--font-dm-sans)] text-[13px] font-bold text-[var(--ink)]">
                al mes
              </div>
              <div className="font-[var(--font-dm-sans)] text-[12px] text-[var(--ink-soft)]">
                {plan.priceMetaEggs}
              </div>
            </div>
          </div>

          <a href={planHref(plan.id)} className={BTN_RED}>
            {plan.ctaLabel}
            <span aria-hidden>→</span>
          </a>
        </div>

        {/* Media */}
        <div className={mediaOrder}>
          <div className="relative aspect-[4/5] overflow-hidden rounded-3xl shadow-[0_30px_60px_-24px_rgba(34,26,15,0.4)] min-[880px]:aspect-[5/6]">
            {MEDIA_READY ? (
              <Image
                src={media.src}
                alt={media.alt}
                fill
                sizes="(min-width: 880px) 45vw, 100vw"
                className="object-cover"
              />
            ) : (
              <MediaPlaceholder kind="image" label={media.alt} />
            )}

            <ScanCorners light />
            <FichaCard ficha={media.ficha} />
          </div>
        </div>
      </div>
    </section>
  );
}
