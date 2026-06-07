import { useSyncExternalStore } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

const subscribe = (onChange: () => void) => {
  const mq = window.matchMedia(QUERY);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
};

/**
 * Tracks `prefers-reduced-motion: reduce` via useSyncExternalStore. Returns
 * `false` on the server / during hydration, then the real preference on the
 * client — so the Remotion players can fall back to static frames for users who
 * opt out of motion.
 */
export function useReducedMotion(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(QUERY).matches,
    () => false,
  );
}
