import type { CSSProperties } from "react";

/**
 * Section-scoped palette tokens (the project's spec palette), injected inline so
 * the `/planes` route is fully self-contained — mirrors the landing sections'
 * SECTION_TOKENS pattern, plus the two dark surfaces (`--dark`, `--dark-soft`)
 * and the lighter moss this page needs over the black blocks.
 *
 * Applied once on the page's `<main>` wrapper so every block inherits the vars.
 */
export const PLANES_TOKENS = {
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
  "--moss-light": "#6B8254",
  "--dark": "#1A1410",
  "--dark-soft": "#2A2117",
} as CSSProperties;

/** Faint 70px grid hairlines over the dark blocks — same texture as Impacto. */
export const GRID_TEXTURE =
  "repeating-linear-gradient(0deg, transparent 0, transparent 70px, rgba(255,251,240,0.015) 70px, rgba(255,251,240,0.015) 71px)," +
  "repeating-linear-gradient(90deg, transparent 0, transparent 70px, rgba(255,251,240,0.015) 70px, rgba(255,251,240,0.015) 71px)";
