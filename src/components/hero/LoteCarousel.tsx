"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { LoteDataSlot, LoteHeaderSlot } from "./LoteCard";
import { lotes } from "./lotes.data";
import { SharedMap } from "./SharedMap";

const AUTO_ROTATE_MS = 7000;
const SWIPE_THRESHOLD_PX = 50;

const carouselTokens = {
  "--cream": "#F6EFDC",
  "--cream-deep": "#EFE5C9",
  "--ink": "#221A0F",
  "--ink-soft": "#4A3D2A",
  "--red": "#E61A27",
  "--red-deep": "#B81420",
  "--yolk": "#F2A900",
  "--yolk-deep": "#C97D00",
  "--shell": "#FFFBF0",
  "--moss": "#4A5D3A",
} as CSSProperties;

function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  return reduced;
}

export function LoteCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const reducedMotion = useReducedMotion();
  const touchStartX = useRef<number | null>(null);

  const active = lotes[currentIndex];

  const next = useCallback(() => {
    setCurrentIndex((i) => (i + 1) % lotes.length);
  }, []);

  const prev = useCallback(() => {
    setCurrentIndex((i) => (i - 1 + lotes.length) % lotes.length);
  }, []);

  useEffect(() => {
    if (reducedMotion || isPaused) return;
    const id = window.setInterval(next, AUTO_ROTATE_MS);
    return () => window.clearInterval(id);
  }, [reducedMotion, isPaused, next]);

  function onKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      prev();
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      next();
    }
  }

  function onTouchStart(e: React.TouchEvent<HTMLDivElement>) {
    touchStartX.current = e.touches[0].clientX;
  }

  function onTouchEnd(e: React.TouchEvent<HTMLDivElement>) {
    if (touchStartX.current === null) return;
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (delta > SWIPE_THRESHOLD_PX) prev();
    else if (delta < -SWIPE_THRESHOLD_PX) next();
  }

  return (
    <div
      role="region"
      aria-label="Lotes de productores"
      aria-roledescription="carousel"
      tabIndex={0}
      className="group relative rounded-3xl outline-none focus-visible:ring-2 focus-visible:ring-[var(--red)] focus-visible:ring-offset-4"
      style={carouselTokens}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocus={() => setIsPaused(true)}
      onBlur={() => setIsPaused(false)}
      onKeyDown={onKeyDown}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      aria-live="polite"
    >
      <article
        className="relative rounded-3xl border border-[rgba(34,26,15,0.06)] bg-[var(--shell)] p-7"
        style={{
          boxShadow:
            "0 1px 0 rgba(255,255,255,0.6) inset, 0 30px 60px -20px rgba(34,26,15,0.18), 0 8px 20px -10px rgba(34,26,15,0.1)",
        }}
      >
        {/* Header stack (sticker + LOTE id + status pill) */}
        <div className="relative min-h-[58px] pb-4 border-b border-dashed border-[rgba(34,26,15,0.18)]">
          {lotes.map((lote, i) => (
            <LoteHeaderSlot key={lote.id} lote={lote} active={i === currentIndex} />
          ))}
        </div>

        {/* Shared map — marker animates across positions */}
        <div className="mt-5">
          <SharedMap activeId={active.id} distanceKm={active.distanciaKm} />
        </div>

        {/* Data grid stack */}
        <div className="relative mt-5 min-h-[96px]">
          {lotes.map((lote, i) => (
            <LoteDataSlot key={lote.id} lote={lote} active={i === currentIndex} />
          ))}
        </div>
      </article>

      {/* Arrows — desktop only, revealed on hover */}
      <button
        type="button"
        onClick={prev}
        aria-label="Lote anterior"
        className="absolute -left-[18px] top-1/2 hidden size-9 -translate-y-1/2 items-center justify-center rounded-full border border-[rgba(34,26,15,0.1)] bg-[var(--shell)] text-[var(--ink)] opacity-0 transition-opacity duration-200 hover:border-transparent hover:bg-[var(--red)] hover:text-[var(--shell)] group-hover:opacity-100 lg:flex"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
          <path
            d="M9 11L5 7l4-4"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      <button
        type="button"
        onClick={next}
        aria-label="Lote siguiente"
        className="absolute -right-[18px] top-1/2 hidden size-9 -translate-y-1/2 items-center justify-center rounded-full border border-[rgba(34,26,15,0.1)] bg-[var(--shell)] text-[var(--ink)] opacity-0 transition-opacity duration-200 hover:border-transparent hover:bg-[var(--red)] hover:text-[var(--shell)] group-hover:opacity-100 lg:flex"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
          <path
            d="M5 3l4 4-4 4"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {/* Dots */}
      <div className="mt-6 flex items-center justify-center gap-2">
        {lotes.map((lote, i) => {
          const isActive = i === currentIndex;
          return (
            <button
              key={lote.id}
              type="button"
              onClick={() => setCurrentIndex(i)}
              aria-label={`Ver lote ${i + 1}`}
              aria-current={isActive || undefined}
              className={`h-2 rounded-full transition-[width,background-color,opacity] duration-300 ${
                isActive
                  ? "w-6 bg-[var(--red)] opacity-100"
                  : "w-2 bg-[var(--ink-soft)] opacity-30 hover:opacity-50"
              }`}
            />
          );
        })}
      </div>
    </div>
  );
}
