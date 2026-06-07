import type { Productor } from "./types";

interface CarouselControlsProps {
  current: number;
  total: number;
  productores: Productor[];
  onPrev: () => void;
  onNext: () => void;
  onGoTo: (idx: number) => void;
}

const arrowClass = [
  "flex size-10 items-center justify-center rounded-full",
  "border border-[var(--ink)]/12 bg-[var(--shell)] text-[18px] text-[var(--ink)]",
  "font-[var(--font-dm-sans)] leading-none",
  "transition-all duration-200 ease-out",
  "hover:-translate-y-px hover:border-[var(--red)] hover:bg-[var(--red)] hover:text-[var(--shell)]",
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--red)]",
].join(" ");

/**
 * Carousel controls: prev/next arrows · animated progress bar · dots.
 *
 * Plain `<button>`s (not HeroUI Button) to match the project's convention of
 * styling bespoke controls directly — and to avoid HeroUI's `.button--md` fixed
 * height (loaded after Tailwind) overriding these custom sizes.
 *
 * On mobile the progress bar wraps to its own full-width row (`order-last`).
 */
export function CarouselControls({
  current,
  total,
  productores,
  onPrev,
  onNext,
  onGoTo,
}: CarouselControlsProps) {
  const progress = ((current + 1) / total) * 100;

  return (
    <div className="mt-5 flex flex-wrap items-center justify-between gap-4 md:gap-6">
      {/* Arrows */}
      <div className="order-1 flex gap-2 md:order-none">
        <button
          type="button"
          aria-label="Productor anterior"
          onClick={onPrev}
          className={arrowClass}
        >
          <span aria-hidden>‹</span>
        </button>
        <button
          type="button"
          aria-label="Productor siguiente"
          onClick={onNext}
          className={arrowClass}
        >
          <span aria-hidden>›</span>
        </button>
      </div>

      {/* Progress */}
      <div className="order-last h-0.5 w-full basis-full overflow-hidden rounded-full bg-[var(--ink)]/10 md:order-none md:w-auto md:flex-1 md:basis-auto">
        <div
          className="prod-progress-fill h-full rounded-full bg-[var(--red)] transition-[width] duration-[400ms] ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Dots */}
      <div className="order-2 flex items-center gap-2 md:order-none">
        {productores.map((p, i) => {
          const isActive = i === current;
          return (
            <button
              key={p.id}
              type="button"
              aria-label={`Ver productor ${i + 1}`}
              aria-current={isActive ? "true" : undefined}
              onClick={() => onGoTo(i)}
              className={[
                "h-2 rounded-full transition-all duration-300 ease-out",
                "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--red)]",
                isActive
                  ? "w-6 bg-[var(--red)]"
                  : "w-2 bg-[var(--ink)]/20 hover:bg-[var(--ink)]/40",
              ].join(" ")}
            />
          );
        })}
      </div>
    </div>
  );
}
