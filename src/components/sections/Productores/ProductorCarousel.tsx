"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";

import { CarouselControls } from "./CarouselControls";
import { ProductorSlide } from "./ProductorSlide";
import { useInView } from "./useInView";
import type { Productor } from "./types";

const AUTOPLAY_MS = 6500;
const SWIPE_THRESHOLD = 50;
const SLIDE_MS = 550;
const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

function subscribeReducedMotion(callback: () => void) {
  const mq = window.matchMedia(REDUCED_MOTION_QUERY);
  mq.addEventListener("change", callback);
  return () => mq.removeEventListener("change", callback);
}

/**
 * Tracks `prefers-reduced-motion` so autoplay opts out and slides snap instead
 * of travelling. `useSyncExternalStore` subscribes without a setState-in-effect.
 */
function useReducedMotion() {
  return useSyncExternalStore(
    subscribeReducedMotion,
    () => window.matchMedia(REDUCED_MOTION_QUERY).matches,
    () => false,
  );
}

/**
 * Single-card carousel that *slides* horizontally — each card travels off one
 * edge as the next arrives from the opposite edge.
 *
 * The DOM order is a looping track: [clone(last), …real…, clone(first)], so
 * track position `i + 1` is real producer `i`. Going past either end slides one
 * clean step onto a clone, then `onTransitionEnd` snaps (with transitions off)
 * to the identical real slide — an invisible jump that makes the loop seamless.
 * Direct dot jumps target real positions only, so they never need a snap.
 *
 * Autoplay is a `setTimeout` keyed on `pos`: every change (auto, click, swipe)
 * restarts it, which advances *and* resets the countdown on interaction.
 */
export function ProductorCarousel({ productores }: { productores: Productor[] }) {
  const total = productores.length;
  const [pos, setPos] = useState(1); // track position; 1 = first real producer
  const [animating, setAnimating] = useState(true); // off only for the seamless wrap snap
  const [paused, setPaused] = useState(false);
  const reducedMotion = useReducedMotion();
  const { ref: inViewRef, inView } = useInView<HTMLDivElement>();
  const touchStartX = useRef<number | null>(null);

  const current = (((pos - 1) % total) + total) % total; // active real index

  // Step one slide. Animated mode may land on a clone (snapped back on
  // transition end); reduced motion jumps straight to the real neighbour.
  const go = (dir: 1 | -1) => {
    if (reducedMotion) {
      setAnimating(false);
      setPos((p) => {
        const cur = (((p - 1) % total) + total) % total;
        return ((cur + dir + total) % total) + 1;
      });
      return;
    }
    setAnimating(true);
    setPos((p) => {
      // Normalize first if we're sitting on a clone (rapid input mid-wrap).
      const base = p === total + 1 ? 1 : p === 0 ? total : p;
      return base + dir;
    });
  };

  // Jump to a specific producer — always a real track position, never a clone.
  const goTo = (i: number) => {
    setAnimating(!reducedMotion);
    setPos((((i % total) + total) % total) + 1);
  };

  useEffect(() => {
    if (paused || reducedMotion || total <= 1) return;
    const id = setTimeout(() => go(1), AUTOPLAY_MS);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pos, paused, reducedMotion, total]);

  const onTrackTransitionEnd = (e: React.TransitionEvent<HTMLDivElement>) => {
    if (e.target !== e.currentTarget || e.propertyName !== "transform") return;
    if (pos === total + 1) {
      setAnimating(false);
      setPos(1);
    } else if (pos === 0) {
      setAnimating(false);
      setPos(total);
    }
  };

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.changedTouches[0].screenX;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].screenX - touchStartX.current;
    if (Math.abs(dx) > SWIPE_THRESHOLD) go(dx > 0 ? -1 : 1);
    touchStartX.current = null;
  };

  const useTransition = animating && !reducedMotion;
  const trackStyle: React.CSSProperties = {
    transform: `translateX(-${pos * 100}%)`,
    transition: useTransition ? `transform ${SLIDE_MS}ms cubic-bezier(0.4, 0, 0.2, 1)` : "none",
  };

  // clone(last) + reals + clone(first)
  const cells = [
    { key: "clone-last", productor: productores[total - 1], trackPos: 0 },
    ...productores.map((p, i) => ({ key: p.id, productor: p, trackPos: i + 1 })),
    { key: "clone-first", productor: productores[0], trackPos: total + 1 },
  ];

  return (
    <div
      role="group"
      aria-roledescription="carrusel"
      aria-label="Productores de la red Huevos Donald"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Full-bleed viewport — breaks out of the centered column so cards travel
          the full width of the page and enter/exit at the screen edges. The
          section's overflow-hidden clips the off-screen cards; this element also
          hosts swipe, the live region, and the in-view sensor for the count-up. */}
      <div
        ref={inViewRef}
        className="relative left-1/2 w-screen -translate-x-1/2"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        aria-live="polite"
      >
        {/* Sliding track */}
        <div className="flex" style={trackStyle} onTransitionEnd={onTrackTransitionEnd}>
          {cells.map((cell) => (
            <ProductorSlide
              key={cell.key}
              productor={cell.productor}
              active={cell.trackPos === pos}
              inView={inView}
            />
          ))}
        </div>
      </div>

      {/* Controls stay within the centered content column. */}
      <div className="mx-auto max-w-[1280px] px-5 md:px-6">
        <CarouselControls
          current={current}
          total={total}
          productores={productores}
          onPrev={() => go(-1)}
          onNext={() => go(1)}
          onGoTo={goTo}
        />
      </div>
    </div>
  );
}
