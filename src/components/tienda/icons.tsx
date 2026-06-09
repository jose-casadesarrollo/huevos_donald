// SVG inline, stroke currentColor. Decorativos: `aria-hidden` + `focusable={false}`
// (los <button> que los contienen llevan su propio aria-label).
import type { DeliveryIconName } from "./types";

type IconProps = { className?: string };

const base = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.7,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
  focusable: false,
};

export function PlusIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export function MinusIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M5 12h14" />
    </svg>
  );
}

export function CheckIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M4 12.5l5 5L20 6.5" />
    </svg>
  );
}

export function CartIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <circle cx="9" cy="20" r="1.4" />
      <circle cx="17" cy="20" r="1.4" />
      <path d="M2.5 3.5h2.4l2.2 11.1a1.5 1.5 0 0 0 1.47 1.2h7.6a1.5 1.5 0 0 0 1.47-1.18L19 7.5H6.1" />
    </svg>
  );
}

export function TruckIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M3 6.5h11v9H3z" />
      <path d="M14 9.5h3.6L21 13v2.5h-2.4" />
      <path d="M9.4 15.5H6" />
      <circle cx="7.5" cy="17.3" r="1.6" />
      <circle cx="16.5" cy="17.3" r="1.6" />
    </svg>
  );
}

export function ShieldIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M12 3l7 3v5c0 4.2-2.9 7.6-7 8.7C7.9 18.6 5 15.2 5 11V6l7-3z" />
      <path d="M9 11.6l2 2 4-4" />
    </svg>
  );
}

export function ClockIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.4V12l3 1.9" />
    </svg>
  );
}

/** Resolución por nombre para los puntos de despacho (data-driven). */
export const deliveryIcons: Record<DeliveryIconName, (props: IconProps) => React.ReactElement> = {
  truck: TruckIcon,
  shield: ShieldIcon,
  clock: ClockIcon,
};
