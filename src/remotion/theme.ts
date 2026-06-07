/**
 * Self-contained palette + font tokens for the Remotion compositions.
 *
 * Compositions render in isolation (and headless, when exported to MP4 via the
 * CLI), so colours are hardcoded hex — they can't rely on the page's CSS custom
 * properties. Fonts reference the page's next/font CSS vars (resolved when the
 * <Player> runs inside the landing) with print-safe fallbacks for headless
 * renders. Mirrors the spec palette shared by Trazabilidad / Contraste /
 * Productores.
 */
export const PALETTE = {
  cream: "#F6EFDC",
  creamDeep: "#EFE5C9",
  ink: "#221A0F",
  inkSoft: "#4A3D2A",
  red: "#E61A27",
  redDeep: "#B81420",
  yolk: "#F2A900",
  yolkDeep: "#C97D00",
  shell: "#FFFBF0",
  moss: "#4A5D3A",
} as const;

export const FONTS = {
  display: 'var(--font-fraunces), Georgia, "Times New Roman", serif',
  body: "var(--font-dm-sans), system-ui, sans-serif",
  mono: 'var(--font-jetbrains-mono), "SFMono-Regular", ui-monospace, monospace',
} as const;
