// Read-only catalog + availability helpers backed by the existing schema.
// All pricing comes from real `plans` rows so the agent never invents numbers.
import type { Db } from "./supabase.ts";

export const CURRENCY = "CLP";

/** _cents are stored as 1/100 of a peso. 399000 -> $3.990 CLP. */
export function formatCLP(cents: number): string {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(Math.round(cents / 100));
}

const FREQUENCY_ES: Record<string, string> = {
  weekly: "semanal",
  biweekly: "quincenal",
  monthly: "mensual",
};

/** Spanish label for a plan frequency (falls back to the raw value if unknown). */
export function frequencyEs(f: string): string {
  return FREQUENCY_ES[f] ?? f;
}

export interface PlanRow {
  id: string;
  slug: string | null;
  name: string;
  description: string | null;
  frequency: "weekly" | "biweekly" | "monthly";
  quantity_per_delivery: number;
  price_cents: number;
  currency: string;
}

export async function listActivePlans(db: Db): Promise<PlanRow[]> {
  const { data, error } = await db
    .from("plans")
    .select(
      "id, slug, name, description, frequency, quantity_per_delivery, price_cents, currency",
    )
    .eq("active", true)
    .order("price_cents", { ascending: true });
  if (error) throw new Error(`listActivePlans: ${error.message}`);
  return data ?? [];
}

export async function getPlanById(db: Db, id: string): Promise<PlanRow | null> {
  const { data, error } = await db
    .from("plans")
    .select(
      "id, slug, name, description, frequency, quantity_per_delivery, price_cents, currency",
    )
    .eq("id", id)
    .eq("active", true)
    .maybeSingle();
  if (error) throw new Error(`getPlanById: ${error.message}`);
  return data;
}

export function describePlan(p: PlanRow): string {
  const freq = frequencyEs(p.frequency);
  return `${p.name} (${freq}): ${p.quantity_per_delivery} huevos por entrega — ${formatCLP(p.price_cents)} ${freq}. [plan_id: ${p.id}]`;
}

export interface ZoneRow {
  id: string;
  name: string;
  comuna: string | null;
}

export async function listActiveZones(db: Db): Promise<ZoneRow[]> {
  const { data, error } = await db
    .from("delivery_zones")
    .select("id, name, comuna")
    .eq("active", true)
    .order("name", { ascending: true });
  if (error) throw new Error(`listActiveZones: ${error.message}`);
  return data ?? [];
}

export async function getZoneById(db: Db, id: string): Promise<ZoneRow | null> {
  const { data, error } = await db
    .from("delivery_zones")
    .select("id, name, comuna")
    .eq("id", id)
    .eq("active", true)
    .maybeSingle();
  if (error) throw new Error(`getZoneById: ${error.message}`);
  return data;
}

/** Calendar weekday (0=Sun..6=Sat) of a YYYY-MM-DD string, tz-independent. */
export function weekdayOf(dateStr: string): number {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

export function isValidDateStr(s: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(s));
}

export interface SlotAvailability {
  slot_id: string;
  slot_name: string;
  start_time: string;
  end_time: string;
  max_orders: number;
  booked: number;
  remaining: number;
}

export interface AvailabilityResult {
  available: boolean;
  reason?: string;
  zone?: ZoneRow;
  weekday?: number;
  slots: SlotAvailability[];
}

// Deliveries/orders that still consume capacity (i.e. not cancelled/failed/skipped).
const ACTIVE_DELIVERY_STATUSES = ["scheduled", "out_for_delivery", "delivered"];
const ACTIVE_ORDER_STATUSES = [
  "pending",
  "awaiting_payment",
  "paid",
  "fulfilling",
];

/**
 * Is `zoneId` serving `dateStr`, and which slots still have capacity?
 * Capacity = slot_capacity.max_orders minus active deliveries + active orders
 * already booked for that (zone, slot, date).
 */
export async function checkAvailability(
  db: Db,
  zoneId: string,
  dateStr: string,
): Promise<AvailabilityResult> {
  if (!isValidDateStr(dateStr)) {
    return { available: false, reason: "Fecha inválida (usa YYYY-MM-DD).", slots: [] };
  }
  const zone = await getZoneById(db, zoneId);
  if (!zone) {
    return { available: false, reason: "Zona no encontrada o inactiva.", slots: [] };
  }

  const weekday = weekdayOf(dateStr);

  const { data: zoneDays, error: zdErr } = await db
    .from("delivery_zone_days")
    .select("weekday")
    .eq("zone_id", zoneId)
    .eq("weekday", weekday)
    .eq("active", true);
  if (zdErr) throw new Error(`checkAvailability/zoneDays: ${zdErr.message}`);
  if (!zoneDays?.length) {
    return {
      available: false,
      reason: "La zona no realiza entregas ese día de la semana.",
      zone,
      weekday,
      slots: [],
    };
  }

  const { data: blackouts, error: boErr } = await db
    .from("delivery_blackout_dates")
    .select("id, zone_id")
    .eq("date", dateStr)
    .or(`zone_id.eq.${zoneId},zone_id.is.null`);
  if (boErr) throw new Error(`checkAvailability/blackouts: ${boErr.message}`);
  if (blackouts?.length) {
    return {
      available: false,
      reason: "Fecha no disponible (feriado o bloqueo de agenda).",
      zone,
      weekday,
      slots: [],
    };
  }

  const { data: caps, error: capErr } = await db
    .from("slot_capacity")
    .select("slot_id, max_orders, delivery_slots(name, start_time, end_time, active)")
    .eq("zone_id", zoneId);
  if (capErr) throw new Error(`checkAvailability/capacity: ${capErr.message}`);

  const { data: deliveries, error: dErr } = await db
    .from("deliveries")
    .select("slot_id, status")
    .eq("zone_id", zoneId)
    .eq("delivery_date", dateStr)
    .in("status", ACTIVE_DELIVERY_STATUSES);
  if (dErr) throw new Error(`checkAvailability/deliveries: ${dErr.message}`);

  const { data: orders, error: oErr } = await db
    .from("orders")
    .select("preferred_slot_id, status")
    .eq("delivery_zone_id", zoneId)
    .eq("requested_delivery_date", dateStr)
    .in("status", ACTIVE_ORDER_STATUSES);
  if (oErr) throw new Error(`checkAvailability/orders: ${oErr.message}`);

  const bookedBySlot = new Map<string, number>();
  for (const d of deliveries ?? []) {
    if (d.slot_id) bookedBySlot.set(d.slot_id, (bookedBySlot.get(d.slot_id) ?? 0) + 1);
  }
  for (const o of orders ?? []) {
    if (o.preferred_slot_id) {
      bookedBySlot.set(
        o.preferred_slot_id,
        (bookedBySlot.get(o.preferred_slot_id) ?? 0) + 1,
      );
    }
  }

  const slots: SlotAvailability[] = [];
  for (const c of caps ?? []) {
    // delivery_slots comes back as an object (to-one embed) or null.
    const slot = c.delivery_slots as unknown as
      | { name: string; start_time: string; end_time: string; active: boolean }
      | null;
    if (!slot || !slot.active) continue;
    const booked = bookedBySlot.get(c.slot_id) ?? 0;
    const remaining = Math.max(0, c.max_orders - booked);
    slots.push({
      slot_id: c.slot_id,
      slot_name: slot.name,
      start_time: slot.start_time,
      end_time: slot.end_time,
      max_orders: c.max_orders,
      booked,
      remaining,
    });
  }
  slots.sort((a, b) => a.start_time.localeCompare(b.start_time));

  const hasCapacity = slots.some((s) => s.remaining > 0);
  return {
    available: hasCapacity,
    reason: hasCapacity ? undefined : "Sin cupos disponibles para esa fecha.",
    zone,
    weekday,
    slots,
  };
}
