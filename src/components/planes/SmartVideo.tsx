"use client";

import { useEffect, useRef } from "react";

import { useReducedMotion } from "./useReducedMotion";

/**
 * Autoplaying, looping, muted food/ASMR clip with two performance/a11y guards:
 *
 *  - **Viewport-gated**: an IntersectionObserver plays the clip only while it's
 *    on screen and pauses it otherwise — important on the ASMR band where several
 *    videos coexist.
 *  - **Reduced-motion aware**: when the user prefers reduced motion the clip is
 *    never started, so the static `poster` frame is what shows.
 *
 * Autoplay is driven from JS (no `autoPlay` attribute) precisely so the
 * reduced-motion path can keep it paused on the poster. Rendered only when
 * `MEDIA_READY` is true (gated at the call site); otherwise <MediaPlaceholder>
 * stands in.
 */
export function SmartVideo({
  src,
  poster,
  alt,
  className,
}: {
  src: string;
  poster?: string;
  alt: string;
  className?: string;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (reduced) {
      el.pause();
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry) return;
        if (entry.isIntersecting) {
          void el.play().catch(() => {
            /* autoplay can still be blocked; poster remains visible */
          });
        } else {
          el.pause();
        }
      },
      { threshold: 0.25 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [reduced]);

  return (
    <video
      ref={ref}
      src={src}
      poster={poster}
      className={className}
      muted
      loop
      playsInline
      preload="metadata"
      aria-label={alt}
      tabIndex={-1}
    />
  );
}
