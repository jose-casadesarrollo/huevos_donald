import type { CSSProperties } from "react";

/**
 * Paleta de la tienda, inyectada inline como CSS vars sobre el `<main>` de cada
 * vista (grid y detalle). Mismo patrón self-contained que `/planes`
 * (`PLANES_TOKENS`) y las secciones del landing: aplicada una vez en el wrapper,
 * cada componente hereda los tokens sin tocar `globals.css`.
 */
export const TIENDA_TOKENS = {
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
} as CSSProperties;
