import type { MetricIconId } from "./types";

const YOLK = "#F2A900";
const SHELL = "#FFFBF0";

/**
 * The four metric glyphs, rendered at 22×22 (viewBox 24). Colors are the brand
 * yolk/shell literals (the egg highlight isn't `currentColor`, so they're baked
 * in rather than inherited). Decorative — `aria-hidden`.
 */
export function MetricIcon({ icon }: { icon: MetricIconId }) {
  switch (icon) {
    case "huevo":
      return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <ellipse cx="12" cy="13" rx="7" ry="9" fill={YOLK} />
          <ellipse cx="9.5" cy="9" rx="2" ry="2.5" fill={SHELL} opacity="0.5" />
        </svg>
      );
    case "co2":
      return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M12 3C8 3 5 6 5 10c0 3 2 5 4 6v3h6v-3c2-1 4-3 4-6 0-4-3-7-7-7z"
            stroke={YOLK}
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
          <path d="M12 11v4M9.5 12.5h5" stroke={YOLK} strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      );
    case "familias":
      return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="8" cy="8" r="3" stroke={YOLK} strokeWidth="1.6" />
          <circle cx="16" cy="9" r="2.5" stroke={YOLK} strokeWidth="1.6" />
          <path
            d="M3 19c0-3 2.5-5 5-5s5 2 5 5M14 19c0-2.5 1.5-4 3.5-4s3.5 1.5 3.5 4"
            stroke={YOLK}
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </svg>
      );
    case "gallinas":
      return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M7 14c0-3 2-5 4.5-5S16 11 16 14c0 2-1 4-4.5 4S7 16 7 14z"
            stroke={YOLK}
            strokeWidth="1.6"
          />
          <path
            d="M11.5 9c0-2 1-3.5 2.5-3.5M14 5.5c1 0 1.5 1 1.5 1.5"
            stroke={YOLK}
            strokeWidth="1.4"
            strokeLinecap="round"
          />
          <circle cx="14" cy="7" r="0.5" fill={YOLK} />
        </svg>
      );
  }
}
