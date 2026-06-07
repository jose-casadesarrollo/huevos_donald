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
import { createOrderPaymentLink } from "./payments.ts";
import { updatePreapproval } from "./mercadopago.ts";

export interface ToolContext {
  conversationId: string;
  channel: string;
  /** Trusted customer id (web session / verified WhatsApp). null = unidentified. */
  userId: string | null;
  identityVia?: "web_session" | "whatsapp_number" | null;
}

/** Returned by account-scoped tools when there is no trusted identity. */
const NEEDS_LOGIN = {
  ok: false as const,
  error:
    "Para gestionar tu cuenta (saldo, puntos o suscripción) necesito que inicies sesión en tu cuenta del sitio web.",
};

/** Internal order_status → customer-facing Spanish label. */
const ORDER_STATUS_ES: Record<string, string> = {
  pending: "Pedido recibido",
  awaiting_payment: "Esperando pago",
  paid: "Pago confirmado",
  fulfilling: "En preparación",
  completed: "Entregado",
  cancelled: "Cancelado",
  refunded: "Reembolsado",
};

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

        // Generate the MercadoPago pay link (hold-first: flips order to awaiting_payment).
        try {
          const pay = await createOrderPaymentLink(db, {
            orderId: insert.data.id,
            source: ctx.channel === "whatsapp" ? "whatsapp" : "web",
          });
          return {
            ok: true,
            order_id: insert.data.id,
            quantity: insert.data.quantity,
            amount_label: formatCLP(insert.data.amount_cents),
            payment_url: pay.paymentUrl,
            hold_minutes: pay.holdMinutes,
            status: "awaiting_payment",
            message:
              `Pedido creado. Para confirmarlo, paga aquí dentro de ${pay.holdMinutes} minutos: ${pay.paymentUrl}`,
          };
        } catch (e) {
          console.error("createOrder: payment link failed", e);
          return {
            ok: false,
            order_id: insert.data.id,
            error:
              "El pedido se creó pero no pude generar el link de pago. Intenta nuevamente en unos minutos.",
          };
        }
      },
    }),

    checkSaldo: tool({
      description:
        "Consulta el saldo de huevos del cliente (requiere sesión iniciada). Úsalo cuando pregunte por su saldo.",
      inputSchema: z.object({}),
      execute: async () => {
        if (!ctx.userId) return NEEDS_LOGIN;
        const { data: subs } = await db
          .from("subscriptions")
          .select("id, status, egg_balance")
          .eq("user_id", ctx.userId)
          .order("created_at", { ascending: false });
        if (!subs || subs.length === 0) {
          return { ok: true, has_subscription: false, message: "No encontré una suscripción en tu cuenta." };
        }
        const active = subs.find((s) => s.status === "authorized") ?? subs[0];
        return {
          ok: true,
          has_subscription: true,
          egg_balance: active.egg_balance,
          subscription_status: active.status,
        };
      },
    }),

    checkPuntos: tool({
      description:
        "Consulta los Puntos Donald acumulados del cliente (requiere sesión iniciada).",
      inputSchema: z.object({}),
      execute: async () => {
        if (!ctx.userId) return NEEDS_LOGIN;
        const { data: profile } = await db
          .from("profiles")
          .select("points_balance")
          .eq("id", ctx.userId)
          .maybeSingle();
        return { ok: true, points_balance: profile?.points_balance ?? 0 };
      },
    }),

    getOrderStatus: tool({
      description:
        "Consulta el estado del pedido del cliente. Sin sesión iniciada, solo el pedido creado en esta conversación.",
      inputSchema: z.object({}),
      execute: async () => {
        let order: { status: string; requested_delivery_date: string | null } | null = null;
        const byConv = await db
          .from("orders")
          .select("status, requested_delivery_date")
          .eq("conversation_id", ctx.conversationId)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        order = byConv.data;
        if (!order && ctx.userId) {
          const byUser = await db
            .from("orders")
            .select("status, requested_delivery_date")
            .eq("user_id", ctx.userId)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();
          order = byUser.data;
        }
        if (!order) {
          return { ok: true, found: false, message: "No encontré un pedido reciente asociado a esta conversación." };
        }
        return {
          ok: true,
          found: true,
          status: order.status,
          status_label: ORDER_STATUS_ES[order.status] ?? order.status,
          requested_delivery_date: order.requested_delivery_date,
        };
      },
    }),

    pauseSubscription: tool({
      description:
        "Pausa la suscripción activa del cliente (requiere sesión y confirmación). Durante la pausa no hay cobros ni despachos y el saldo se conserva.",
      inputSchema: z.object({
        resume_date: z
          .string()
          .nullable()
          .optional()
          .describe("Fecha opcional YYYY-MM-DD para reactivar automáticamente."),
      }),
      needsApproval: true,
      execute: async ({ resume_date }) => {
        if (!ctx.userId) return NEEDS_LOGIN;
        const { data: sub } = await db
          .from("subscriptions")
          .select("id, mercadopago_subscription_id")
          .eq("user_id", ctx.userId)
          .eq("status", "authorized")
          .order("created_at", { ascending: false })
          .maybeSingle();
        if (!sub) return { ok: false, error: "No encontré una suscripción activa para pausar." };
        const { error } = await db
          .from("subscriptions")
          .update({
            status: "paused",
            paused_at: new Date().toISOString(),
            resume_at: resume_date ?? null,
            pause_reason: "customer_request",
            updated_at: new Date().toISOString(),
          })
          .eq("id", sub.id);
        if (error) return { ok: false, error: "No pude pausar tu suscripción. Intenta más tarde." };
        if (sub.mercadopago_subscription_id) {
          try {
            await updatePreapproval(sub.mercadopago_subscription_id, { status: "paused" });
          } catch (e) {
            console.error("pauseSubscription: MP pause failed", e);
          }
        }
        return {
          ok: true,
          message:
            "Tu suscripción quedó en pausa. No habrá cobros ni despachos y tu saldo de huevos se conserva. Reactívala cuando quieras.",
        };
      },
    }),

    cancelSubscription: tool({
      description:
        "Cancela la suscripción del cliente (requiere sesión y confirmación). Sin penalización; los puntos acumulados caducan.",
      inputSchema: z.object({}),
      needsApproval: true,
      execute: async () => {
        if (!ctx.userId) return NEEDS_LOGIN;
        const { data: sub } = await db
          .from("subscriptions")
          .select("id, mercadopago_subscription_id")
          .eq("user_id", ctx.userId)
          .in("status", ["authorized", "paused", "past_due"])
          .order("created_at", { ascending: false })
          .maybeSingle();
        if (!sub) return { ok: false, error: "No encontré una suscripción para cancelar." };
        const { error } = await db
          .from("subscriptions")
          .update({
            status: "cancelled",
            cancelled_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", sub.id);
        if (error) return { ok: false, error: "No pude cancelar tu suscripción. Intenta más tarde." };
        if (sub.mercadopago_subscription_id) {
          try {
            await updatePreapproval(sub.mercadopago_subscription_id, { status: "cancelled" });
          } catch (e) {
            console.error("cancelSubscription: MP cancel failed", e);
          }
        }
        // Puntos caducan al cancelar (SOP §11): post an expiration entry.
        const { data: prof } = await db
          .from("profiles")
          .select("points_balance")
          .eq("id", ctx.userId)
          .maybeSingle();
        const pts = prof?.points_balance ?? 0;
        if (pts > 0) {
          await db.from("points_ledger").insert({
            user_id: ctx.userId,
            subscription_id: sub.id,
            delta: -pts,
            reason: "expiration",
            note: "Cancelación de suscripción",
          });
        }
        return {
          ok: true,
          message:
            "Tu suscripción quedó cancelada, sin penalización. No afecta despachos ya pagados y en preparación. Tus puntos acumulados caducaron.",
        };
      },
    }),

    reactivateSubscription: tool({
      description:
        "Reactiva una suscripción pausada del cliente (requiere sesión y confirmación). Recupera el saldo y los puntos.",
      inputSchema: z.object({}),
      needsApproval: true,
      execute: async () => {
        if (!ctx.userId) return NEEDS_LOGIN;
        const { data: sub } = await db
          .from("subscriptions")
          .select("id, mercadopago_subscription_id")
          .eq("user_id", ctx.userId)
          .eq("status", "paused")
          .order("created_at", { ascending: false })
          .maybeSingle();
        if (!sub) return { ok: false, error: "No encontré una suscripción pausada para reactivar." };
        const { error } = await db
          .from("subscriptions")
          .update({
            status: "authorized",
            reactivated_at: new Date().toISOString(),
            paused_at: null,
            resume_at: null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", sub.id);
        if (error) return { ok: false, error: "No pude reactivar tu suscripción. Intenta más tarde." };
        if (sub.mercadopago_subscription_id) {
          try {
            await updatePreapproval(sub.mercadopago_subscription_id, { status: "authorized" });
          } catch (e) {
            console.error("reactivateSubscription: MP reactivate failed", e);
          }
        }
        return {
          ok: true,
          message: "¡Listo! Tu suscripción está activa de nuevo y recuperaste tu saldo y tus puntos.",
        };
      },
    }),

    reportDamagedProduct: tool({
      description:
        "Registra un reclamo por huevos quebrados o dañados (requiere sesión iniciada). Pide al cliente una breve descripción.",
      inputSchema: z.object({
        description: z.string().describe("Descripción del problema (qué llegó dañado)."),
      }),
      execute: async ({ description }) => {
        if (!ctx.userId) return NEEDS_LOGIN;
        const { data: delivery } = await db
          .from("deliveries")
          .select("id, delivered_at")
          .eq("user_id", ctx.userId)
          .eq("status", "delivered")
          .order("delivered_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        let orderId: string | null = null;
        if (!delivery) {
          const { data: order } = await db
            .from("orders")
            .select("id")
            .eq("user_id", ctx.userId)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();
          orderId = order?.id ?? null;
        }
        const withinWindow = delivery?.delivered_at
          ? Date.now() - new Date(delivery.delivered_at).getTime() <= 24 * 3600 * 1000
          : null;
        const { error } = await db.from("incidents").insert({
          user_id: ctx.userId,
          delivery_id: delivery?.id ?? null,
          order_id: orderId,
          type: "damaged_product",
          description,
          within_window: withinWindow,
        });
        if (error) {
          console.error("reportDamagedProduct: insert failed", error);
          return { ok: false, error: "No pude registrar tu reclamo. Intenta más tarde." };
        }
        return {
          ok: true,
          message:
            "Registré tu reclamo. El plazo es de 24 horas desde la entrega y necesitamos una foto: súbela en tu cuenta del sitio web. Lo resolvemos con reposición (parcial o total) o un cupón de descuento.",
        };
      },
    }),
  };
}

export type AgentTools = ReturnType<typeof buildTools>;
