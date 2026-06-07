import type { ReactNode } from "react";

import type { SilhouetteKind } from "./types";

/**
 * Stylized producer silhouettes — NOT portraits. Each is a minimal SVG with one
 * distinguishing detail (hat, two figures, long hair, moustache). Colors use the
 * section tokens (`--ink` / `--cream`) so they inherit the section palette.
 *
 * These are decorative placeholders. When the client delivers real photos, swap
 * `<ProductorPhoto />`'s inner illustration for an optional `imageUrl`.
 */

function SilhouetteFrame({ children }: { children: ReactNode }) {
  return (
    <svg viewBox="0 0 100 110" fill="none" aria-hidden className="h-auto w-full">
      {children}
    </svg>
  );
}

function ManuelSvg() {
  return (
    <SilhouetteFrame>
      {/* sombrero */}
      <ellipse cx="50" cy="32" rx="22" ry="6" fill="var(--ink)" />
      <ellipse cx="50" cy="30" rx="16" ry="14" fill="var(--ink)" />
      {/* cara */}
      <ellipse cx="50" cy="42" rx="13" ry="11" fill="var(--ink)" opacity="0.85" />
      {/* torso */}
      <path d="M 20 110 Q 20 65, 50 60 Q 80 65, 80 110 Z" fill="var(--ink)" />
      {/* V de camisa */}
      <path d="M 42 65 L 50 75 L 58 65 Z" fill="var(--cream)" opacity="0.4" />
    </SilhouetteFrame>
  );
}

function PerezSvg() {
  return (
    <SilhouetteFrame>
      {/* cabezas */}
      <ellipse cx="36" cy="38" rx="11" ry="10" fill="var(--ink)" />
      <ellipse cx="64" cy="36" rx="12" ry="11" fill="var(--ink)" opacity="0.9" />
      {/* torsos */}
      <path d="M 10 110 Q 12 70, 36 65 Q 58 70, 60 110 Z" fill="var(--ink)" />
      <path d="M 40 110 Q 42 68, 64 62 Q 88 68, 90 110 Z" fill="var(--ink)" opacity="0.92" />
    </SilhouetteFrame>
  );
}

function SotoSvg() {
  return (
    <SilhouetteFrame>
      {/* pelo largo */}
      <ellipse cx="50" cy="28" rx="20" ry="4" fill="var(--ink)" opacity="0.7" />
      <ellipse cx="50" cy="35" rx="14" ry="13" fill="var(--ink)" />
      {/* torso */}
      <path d="M 24 110 Q 24 68, 50 62 Q 76 68, 76 110 Z" fill="var(--ink)" />
      {/* detalle cuello */}
      <path d="M 50 75 L 47 82 L 53 82 Z" fill="var(--cream)" opacity="0.4" />
    </SilhouetteFrame>
  );
}

function JuanSvg() {
  return (
    <SilhouetteFrame>
      {/* sombrero ancho */}
      <ellipse cx="50" cy="30" rx="24" ry="8" fill="var(--ink)" />
      {/* cara */}
      <ellipse cx="50" cy="36" rx="13" ry="12" fill="var(--ink)" opacity="0.9" />
      {/* bigote */}
      <ellipse cx="50" cy="48" rx="6" ry="3" fill="var(--cream)" opacity="0.3" />
      {/* torso */}
      <path d="M 22 110 Q 22 66, 50 60 Q 78 66, 78 110 Z" fill="var(--ink)" />
    </SilhouetteFrame>
  );
}

export function Silhouette({ kind }: { kind: SilhouetteKind }) {
  switch (kind) {
    case "manuel":
      return <ManuelSvg />;
    case "perez":
      return <PerezSvg />;
    case "soto":
      return <SotoSvg />;
    case "juan":
      return <JuanSvg />;
  }
}
