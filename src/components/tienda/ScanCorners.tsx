/**
 * Esquinas tipo cámara/scan sobre las cuatro esquinas internas de un padre
 * `position: relative`. Puramente decorativo — mismo motivo que la sección
 * Trazabilidad, el hero del landing y el ScanCorners de `/planes`.
 *
 * Por defecto se dibujan en `--ink` (sobre superficies claras: cards, placeholder
 * cálido). Pasa `light` para la variante `--shell` sobre fotos oscuras.
 */
export function ScanCorners({ light = false }: { light?: boolean }) {
  const color = light ? "var(--shell)" : "var(--ink)";
  const corner = "absolute h-[18px] w-[18px]";

  return (
    <span
      aria-hidden
      className="pointer-events-none absolute inset-[12px] z-[3]"
      style={{ opacity: light ? 0.7 : 0.25 }}
    >
      <span
        className={`${corner} left-0 top-0 rounded-tl-[3px] border-l-2 border-t-2`}
        style={{ borderColor: color }}
      />
      <span
        className={`${corner} right-0 top-0 rounded-tr-[3px] border-r-2 border-t-2`}
        style={{ borderColor: color }}
      />
      <span
        className={`${corner} bottom-0 left-0 rounded-bl-[3px] border-b-2 border-l-2`}
        style={{ borderColor: color }}
      />
      <span
        className={`${corner} bottom-0 right-0 rounded-br-[3px] border-b-2 border-r-2`}
        style={{ borderColor: color }}
      />
    </span>
  );
}
