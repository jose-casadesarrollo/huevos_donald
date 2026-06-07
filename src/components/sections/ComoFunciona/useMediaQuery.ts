import { useCallback, useSyncExternalStore } from "react";

/**
 * SSR-safe media-query hook built on useSyncExternalStore: returns `false` on
 * the server (and during hydration), then the real match on the client. Used to
 * swap the lifecycle Player between its horizontal (desktop) and vertical
 * (mobile) compositions at the 768px breakpoint.
 */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const mq = window.matchMedia(query);
      mq.addEventListener("change", onChange);
      return () => mq.removeEventListener("change", onChange);
    },
    [query],
  );

  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => false,
  );
}
