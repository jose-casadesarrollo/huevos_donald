import { useSyncExternalStore } from "react";

const emptySubscribe = () => () => {};

/**
 * Returns `false` on the server / during hydration and `true` once mounted on
 * the client — without a setState-in-effect. Used to defer Remotion's <Player>
 * (which touches `window`) until after hydration.
 */
export function useMounted(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
}
