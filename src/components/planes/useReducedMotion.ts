"use client";

import { useSyncExternalStore } from "react";

const RM_QUERY = "(prefers-reduced-motion: reduce)";

/**
 * SSR-safe `prefers-reduced-motion: reduce`. Returns `false` until mounted, then
 * tracks the media query live. Mirrors the Planes landing section's hook so the
 * video islands and the FAQ never animate when the user opts out.
 */
export function useReducedMotion(): boolean {
  return useSyncExternalStore(
    (cb) => {
      const mq = window.matchMedia(RM_QUERY);
      mq.addEventListener("change", cb);
      return () => mq.removeEventListener("change", cb);
    },
    () => window.matchMedia(RM_QUERY).matches,
    () => false,
  );
}
