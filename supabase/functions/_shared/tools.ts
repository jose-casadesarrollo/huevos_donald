// AI SDK v5 tool definitions for the ordering agent.
// Read-only tools execute immediately; createOrder is guarded with needsApproval
// so the customer must confirm before the order is committed to the DB.
import { tool } from "ai";
import { z } from "zod";
import type { Db } from "./supabase.ts";
import {
  checkAvailability,
  CURRENCY,
  describePlan,
  formatCLP,
  getPlanById,
  getZoneById,
  isValidDateStr,
  listActivePlans,
  listActiveZones,
} from "./catalog.ts";

export interface ToolContext {
  conversationId: string;
  channel: string;
}

/** Chile E.164-without-plus: ^56[0-9]{8,9}$. Returns normalized or null. */
export function normalizePhone(raw: string): string | null {
  const digits = (raw ?? "").replace(/\D/g, "");
  const candidate = /^56\d{8,9}$/.test(digits)
    ? digits
    : /^\d{8,9}$/.test(digits)
      ? `56${digits}`
      : "";
  return /^56\d{8,9}$/.test(candidate) ? candidate : null;
}

/** Human-readable summary of a createOrder draft, for the approval prompt. */
export async function summarizeOrderDraft(
  db: Db,
  input: Record<string, unknown>,
): Promise<string> {
  const planId = String(input.plan_id ?? "");
  const zoneId = String(input.delivery_zone_id ?? "");
  const plan = planId ? await getPlanById(db, planId) : null;
  const zone = zoneId ? await getZoneById(db, zoneId) : null;
  const phone = normalizePhone(String(input.contact_phone ?? "")) ??
    String(input.contact_phone ?? "—");

  const lines = ["📋 *Resumen del pedido*"];
  if (plan) {
    lines.push(`• Plan: ${plan.name} — ${plan.quantity_per_delivery} huevos`);
    lines.push(`• Precio: ${formatCLP(plan.price_cents)}`);
  }
  if (zone) lines.push(`• Zona: ${zone.name}${zone.comuna ? ` (${zone.comuna})` : ""}`);
  lines.push(`• Fecha: ${input.requested_delivery_date ?? "por confirmar"}`);
  if (input.delivery_address) lines.push(`• Dirección: ${input.delivery_address}`);
  lines.push(`• Teléfono: ${phone}`);
  return lines.join("\n");
}

export function buildTools(db: Db, ctx: ToolContext) {
  return {
    listPlans: tool({
      description:
        "Lista los planes de suscripción de huevos activos (nombre, frecuencia, cantidad por entrega y precio en CLP). Úsalo cuando el cliente pregunte por planes o precios.",
      inputSchema: z.object({}),
      execute: async () => {
        const plans = await listActivePlans(db);
        return {
          currency: CURRENCY,
          plans: plans.map((p) => ({
            plan_id: p.id,
            name: p.name,
            frequency: p.frequency,
            quantity_per_delivery: p.quantity_per_delivery,
            price_cents: p.price_cents,
            price_label: formatCLP(p.price_cents),
            summary: describePlan(p),
          })),
        };
      },
    }),

    listZones: tool({
      description:
        "Lista las zonas/comunas de reparto activas. Úsalo para saber si entregamos en la zona del cliente y para obtener el zone_id.",
      inputSchema: z.object({}),
      execute: async () => {
        const zones = await listActiveZones(db);
        return {
          zones: zones.map((z) => ({
            zone_id: z.id,
            name: z.name,
            comuna: z.comuna,
          })),
        };
      },
    }),

    checkDeliveryAvailability: tool({
      description:
        "Verifica si una zona realiza entregas en una fecha (YYYY-MM-DD) y qué bloques horarios (slots) tienen cupo. Úsalo antes de crear un pedido para confirmar fecha y slot.",
      inputSchema: z.object({
        zone_id: z.string().describe("El zone_id obtenido de listZones"),
        date: z.string().describe("Fecha deseada en formato YYYY-MM-DD"),
      }),
      execute: async ({ zone_id, date }) => {
        const result = await checkAvailability(db, zone_id, date);
        return {
          available: result.available,
          reason: result.reason ?? null,
          zone: result.zone ? { zone_id: result.zone.id, name: result.zone.name } : null,
          slots: result.slots.map((s) => ({
            slot_id: s.slot_id,
            name: s.slot_name,
            window: `${s.start_time}–${s.end_time}`,
            remaining: s.remaining,
          })),
        };
      },
    }),

    createOrder: tool({
      description:
        "Crea un pedido de una entrega única basada en un plan del catálogo. Requiere confirmación del cliente antes de ejecutarse. La cantidad y el monto se toman del plan elegido; nunca inventes precios.",
      inputSchema: z.object({
        plan_id: z.string().describe("plan_id del catálogo (de listPlans)"),
        contact_phone: z
          .string()
          .describe("Teléfono de contacto en Chile, ej: 56912345678"),
        contact_name: z.string().nullable().optional(),
        delivery_zone_id: z.string().describe("zone_id de la zona de entrega"),
        preferred_slot_id: z.string().nullable().optional(),
        requested_delivery_date: z
          .string()
          .nullable()
          .optional()
          .describe("Fecha de entrega deseada YYYY-MM-DD"),
        delivery_address: z.string().nullable().optional(),
        delivery_notes: z.string().nullable().optional(),
      }),
      // Customer-in-the-loop: do not commit the order until it's approved.
      needsApproval: true,
      execute: async (input) => {
        const phone = normalizePhone(input.contact_phone);
        if (!phone) {
          return {
            ok: false,
            error:
              "Teléfono inválido. Debe ser un número chileno, ej: 56912345678.",
          };
        }

        const plan = await getPlanById(db, input.plan_id);
        if (!plan) {
          return { ok: false, error: "Plan no encontrado o inactivo." };
        }

        const zone = await getZoneById(db, input.delivery_zone_id);
        if (!zone) {
          return { ok: false, error: "Zona de entrega no encontrada o inactiva." };
        }

        // If a date was given, re-validate availability at commit time.
        if (input.requested_delivery_date) {
          if (!isValidDateStr(input.requested_delivery_date)) {
            return { ok: false, error: "Fecha inválida (usa YYYY-MM-DD)." };
          }
          const avail = await checkAvailability(
            db,
            input.delivery_zone_id,
            input.requested_delivery_date,
          );
          if (!avail.available) {
            return {
              ok: false,
              error: avail.reason ?? "No hay disponibilidad para esa fecha.",
            };
          }
          if (input.preferred_slot_id) {
            const slot = avail.slots.find((s) => s.slot_id === input.preferred_slot_id);
            if (!slot || slot.remaining <= 0) {
              return { ok: false, error: "El bloque horario elegido no tiene cupo." };
            }
          }
        }

        const insert = await db
          .from("orders")
          .insert({
            contact_phone: phone,
            contact_name: input.contact_name ?? null,
            quantity: plan.quantity_per_delivery,
            amount_cents: plan.price_cents,
            currency: plan.currency ?? CURRENCY,
            status: "pending",
            source: "agent",
            plan_id: plan.id,
            delivery_zone_id: zone.id,
            preferred_slot_id: input.preferred_slot_id ?? null,
            requested_delivery_date: input.requested_delivery_date ?? null,
            delivery_address: input.delivery_address ?? null,
            delivery_notes: input.delivery_notes ?? null,
            conversation_id: ctx.conversationId,
          })
          .select("id, quantity, amount_cents, currency")
          .single();
        if (insert.error) {
          return { ok: false, error: `No se pudo crear el pedido: ${insert.error.message}` };
        }

        // Link the order back to the conversation (best-effort: log, never throw —
        // the order is already committed and must not be lost).
        const link = await db
          .from("agent_conversations")
          .update({ order_id: insert.data.id })
          .eq("id", ctx.conversationId);
        if (link.error) {
          console.error(`createOrder: failed to link order to conversation: ${link.error.message}`);
        }

        return {
          ok: true,
          order_id: insert.data.id,
          quantity: insert.data.quantity,
          amount_label: formatCLP(insert.data.amount_cents),
          status: "pending",
          message:
            "Pedido creado. Próximo paso: enviaremos el link de pago para confirmar.",
        };
      },
    }),
  };
}

export type AgentTools = ReturnType<typeof buildTools>;
