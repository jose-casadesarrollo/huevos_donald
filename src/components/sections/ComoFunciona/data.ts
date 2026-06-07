import { lifecycleNotifs, lifecycleStates } from "@/remotion/data";

import type { StepData } from "./types";

export const steps: StepData[] = [
  {
    num: "01",
    category: "Plan",
    title: "Eliges tu plan",
    titleEm: "plan",
    desc: "Compras un saldo de huevos al mes. Lo vas consumiendo a tu ritmo. Por cada compra acumulas puntos Donald.",
    tags: [{ label: "Saldo flexible" }, { label: "Sistema de puntos", accent: true }],
    vizComponent: "saldo",
  },
  {
    num: "02",
    category: "Agenda",
    title: "Configuras tu agenda",
    titleEm: "agenda",
    desc: "Asignamos tu día de despacho según tu comuna. Tú eliges la ventana horaria que mejor te calza.",
    tags: [{ label: "Día asignado" }, { label: "Ventana horaria", accent: true }],
    vizComponent: "agenda",
  },
  {
    num: "03",
    category: "Entrega",
    title: "Sigues tu pedido",
    titleEm: "pedido",
    desc: "Seis estados visibles en tiempo real. Te notificamos a 20 y 5 minutos antes de la entrega. Sin sorpresas.",
    tags: [{ label: "6 estados" }, { label: "Notif. 20′ y 5′", accent: true }],
    vizComponent: "notif",
  },
];

// Microcopy footer — neutral phrasing that avoids exposing the internal SOP
// version publicly (see the spec's "contenido sensible" note).
export const sopFooter = "PROCESO OPERACIONAL DONALD 2026";

export { lifecycleNotifs, lifecycleStates };
