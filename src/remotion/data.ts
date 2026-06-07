/**
 * Lifecycle data for the "vida útil de un pedido" timeline. Lives in the
 * Remotion tree (relative-importable, no `@/` alias) so both the compositions
 * and the Remotion CLI Root can consume it without a custom webpack alias.
 * The landing section re-exports these from its own `data.ts`.
 *
 * The six states mirror the operational SOP. Adjust labels here if the SOP
 * names change — this is the single source of truth.
 */
export interface LifecycleState {
  num: string; // "01" .. "06"
  label: string;
  time: string;
  status: "done" | "current" | "pending";
}

export interface LifecycleNotif {
  position: number; // 0-100, % along the horizontal track
  label: string;
}

export const lifecycleStates: LifecycleState[] = [
  { num: "01", label: "Pedido recibido", time: "Día 1", status: "done" },
  { num: "02", label: "Pago confirmado", time: "Día 1", status: "done" },
  { num: "03", label: "En preparación", time: "Día 2", status: "done" },
  { num: "04", label: "Listo para despacho", time: "Día 3", status: "done" },
  { num: "05", label: "En camino", time: "Día 3", status: "current" },
  { num: "06", label: "Entregado", time: "~14:30", status: "pending" },
];

export const lifecycleNotifs: LifecycleNotif[] = [
  { position: 75, label: "NOTIF · 20 MIN" },
  { position: 88, label: "NOTIF · 5 MIN" },
];
