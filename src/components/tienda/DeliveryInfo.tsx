import { deliveryIcons } from "./icons";
import type { DeliveryPoint } from "./types";

/** Bloque cream con los 3 puntos de despacho (ícono moss + texto). */
export function DeliveryInfo({ points }: { points: DeliveryPoint[] }) {
  return (
    <div className="flex flex-col gap-3 rounded-[14px] bg-[var(--cream)] p-4">
      {points.map((point) => {
        const Icon = deliveryIcons[point.icon];
        return (
          <div key={point.title} className="flex items-start gap-3">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[var(--shell)] text-[var(--moss)]">
              <Icon className="size-4" />
            </span>
            <p className="pt-1 font-[var(--font-dm-sans)] text-[13px] leading-[1.45] text-[var(--ink-soft)]">
              <strong className="font-semibold text-[var(--ink)]">{point.title}</strong> {point.text}
            </p>
          </div>
        );
      })}
    </div>
  );
}
