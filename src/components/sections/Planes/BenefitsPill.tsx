import { Fragment } from "react";

import { CheckIcon } from "./CheckIcon";
import type { CommonBenefit } from "./types";

/**
 * Single centered pill of benefits shared by every plan, divided by thin rules.
 * Collapses to a left-aligned column (dividers hidden) below 600px.
 */
export function BenefitsPill({ benefits }: { benefits: CommonBenefit[] }) {
  return (
    <div className="mx-auto mt-2 flex max-w-fit flex-wrap items-center justify-center gap-x-5 gap-y-2.5 rounded-[999px] border border-[rgba(34,26,15,0.06)] bg-[var(--shell)] px-6 py-[18px] max-[600px]:flex-col max-[600px]:items-start max-[600px]:rounded-[18px]">
      {benefits.map((benefit, i) => (
        <Fragment key={benefit.label}>
          {i > 0 && (
            <span aria-hidden className="h-[14px] w-px bg-[rgba(34,26,15,0.15)] max-[600px]:hidden" />
          )}
          <span className="inline-flex items-center gap-2">
            <CheckIcon className="size-[14px] shrink-0 text-[var(--moss)]" />
            <span className="font-[var(--font-dm-sans)] text-[12px] font-medium text-[var(--ink-soft)]">
              {benefit.label}
            </span>
          </span>
        </Fragment>
      ))}
    </div>
  );
}
