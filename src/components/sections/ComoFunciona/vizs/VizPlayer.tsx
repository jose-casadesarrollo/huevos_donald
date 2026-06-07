"use client";

import { Player, type PlayerRef } from "@remotion/player";
import { type ComponentType, type ReactNode, useEffect, useRef } from "react";

import { useMounted } from "../useMounted";
import { useReducedMotion } from "../useReducedMotion";

interface VizPlayerProps {
  /** A prop-less Remotion composition. */
  component: ComponentType;
  durationInFrames: number;
  compositionWidth: number;
  compositionHeight: number;
  fps?: number;
  ariaLabel: string;
  /** Static frame shown during SSR and for `prefers-reduced-motion`. */
  fallback: ReactNode;
}

/**
 * Shared wrapper around Remotion's <Player>. Three responsibilities:
 *  - SSR/first-paint safety: render the static fallback until mounted (the
 *    Player touches `window`), then swap in the live player.
 *  - Accessibility: honour `prefers-reduced-motion` by never mounting the
 *    Player — the fallback stands in permanently.
 *  - Performance: pause the Player while it's off-screen via IntersectionObserver.
 */
export function VizPlayer({
  component,
  durationInFrames,
  compositionWidth,
  compositionHeight,
  fps = 30,
  ariaLabel,
  fallback,
}: VizPlayerProps) {
  const reduced = useReducedMotion();
  const mounted = useMounted();
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<PlayerRef>(null);

  useEffect(() => {
    if (!mounted || reduced) return;
    const el = containerRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        const player = playerRef.current;
        if (!player) return;
        if (entry.isIntersecting) player.play();
        else player.pause();
      },
      { threshold: 0.15 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [mounted, reduced]);

  const showStatic = !mounted || reduced;

  return (
    <div ref={containerRef} role="img" aria-label={ariaLabel} className="h-full w-full">
      {showStatic ? (
        fallback
      ) : (
        <Player
          ref={playerRef}
          component={component}
          durationInFrames={durationInFrames}
          compositionWidth={compositionWidth}
          compositionHeight={compositionHeight}
          fps={fps}
          style={{ width: "100%", height: "100%" }}
          autoPlay
          loop
          controls={false}
          clickToPlay={false}
          doubleClickToFullscreen={false}
          showVolumeControls={false}
          acknowledgeRemotionLicense
        />
      )}
    </div>
  );
}
