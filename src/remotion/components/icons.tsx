import type { FC } from "react";

/**
 * Inline, vector-only icons shared by the compositions. No external icon
 * library (per spec) — every glyph is hand-rolled SVG so it renders identically
 * in the browser <Player> and in headless MP4 exports.
 */

export const Bell: FC<{ color: string; size?: number }> = ({ color, size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
    <path
      d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9Z"
      fill={color}
    />
    <path
      d="M13.73 21a2 2 0 0 1-3.46 0"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const Check: FC<{ color: string; size?: number }> = ({ color, size = 12 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
    <path
      d="M5 12.5l4.2 4.2L19 7"
      stroke={color}
      strokeWidth={3}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
