import { Card } from "@heroui/react";

import { ProductorInfo } from "./ProductorInfo";
import { ProductorPhoto } from "./ProductorPhoto";
import type { Productor } from "./types";

interface ProductorSlideProps {
  productor: Productor;
  /** True when this cell is the one centred in the viewport. */
  active: boolean;
  /** True once the carousel has scrolled into view — gates the stat count-up. */
  inView: boolean;
}

/**
 * One carousel cell. The cell is full viewport width (`flex-[0_0_100%]`) so the
 * sliding track is full-bleed, but the card inside stays within the centered
 * 1280px content column (aligned with the header) for readability. The result:
 * cards travel the full width of the page, entering/exiting at the screen edges.
 *
 * The horizontal travel is animated on the track (see ProductorCarousel), not
 * here. Non-centred cells are `aria-hidden`.
 */
export function ProductorSlide({ productor, active, inView }: ProductorSlideProps) {
  return (
    <div
      role="group"
      aria-roledescription="diapositiva"
      aria-label={productor.nombre}
      aria-hidden={!active}
      className="shrink-0 grow-0 basis-full"
    >
      <div className="mx-auto h-full max-w-[1280px] px-5 md:px-6">
        <Card
          variant="transparent"
          className={[
            "h-full overflow-hidden rounded-[20px] border border-[var(--ink)]/8 bg-[var(--shell)] p-0",
            "shadow-[0_1px_0_rgba(255,255,255,0.6)_inset,0_30px_60px_-20px_rgba(34,26,15,0.15),0_8px_20px_-10px_rgba(34,26,15,0.08)]",
          ].join(" ")}
        >
          <div className="grid h-full grid-cols-1 md:grid-cols-[0.85fr_1.15fr]">
            <ProductorPhoto productor={productor} />
            <ProductorInfo productor={productor} inView={inView} />
          </div>
        </Card>
      </div>
    </div>
  );
}
