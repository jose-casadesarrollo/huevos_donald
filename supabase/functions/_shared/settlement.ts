// Shared payment settlement — used by the webhook (authoritative refetch) and the
// cleanup cron (re-poll by external_reference). Idempotent: safe to run twice.
import type { Db } from "./supabase.ts";
import type { Json } from "./database.types.ts";
import { mapPaymentStatus, type MpPayment } from "./mercadopago.ts";
import { sendWhatsAppMessage } from "./whatsapp.ts";

export interface PaymentRow {
  id: string;
  status: string;
  order_id: string | null;
  source: string;
}

/** Notify the WhatsApp chat tied to an order, if any. Best-effort. */
export async function notifyWhatsAppForOrder(
  db: Db,
  orderId: string,
  text: string,
): Promise<void> {
  const { data: order } = await db
    .from("orders")
    .select("conversation_id")
    .eq("id", orderId)
    .maybeSingle();
  if (!order?.conversation_id) return;
  const { data: conv } = await db
    .from("agent_conversations")
    .select("channel, external_id")
    .eq("id", order.conversation_id)
    .maybeSingle();
  if (conv?.channel === "whatsapp" && conv.external_id) {
    try {
      await sendWhatsAppMessage(db, conv.external_id, text);
    } catch (e) {
      console.error("notifyWhatsAppForOrder send failed", e);
    }
  }
}

/**
 * On the payment→approved transition for a customer order: queue a "payment
 * confirmed" notification and award Puntos Donald. Best-effort; the caller wraps
 * this so a failure can't break settlement. Only posts once (guarded by the
 * `transitioned` flag at the call site). Points are skipped until the
 * `points_earn_rate` app_setting is configured (TBD), so no wrong figure is ever
 * awarded. Rate unit: puntos por peso CLP (e.g. 0.01 = 1 punto cada $100).
 */
async function recordPaymentApproved(
  db: Db,
  order: { id: string; user_id: string | null; amount_cents: number },
  pay: PaymentRow,
): Promise<void> {
  if (!order.user_id) return;
  await db.from("notification_events").insert({
    user_id: order.user_id,
    order_id: order.id,
    event_type: "payment_confirmed",
    channel: "whatsapp",
    status: "pending",
  });
  const { data: setting } = await db
    .from("app_settings")
    .select("value")
    .eq("key", "points_earn_rate")
    .maybeSingle();
  const rate = typeof setting?.value === "number" ? setting.value : null;
  if (rate && rate > 0) {
    const pts = Math.floor(Math.round(order.amount_cents / 100) * rate);
    if (pts > 0) {
      await db.from("points_ledger").insert({
        user_id: order.user_id,
        order_id: order.id,
        payment_id: pay.id,
        delta: pts,
        reason: "purchase",
      });
    }
  }
}

/**
 * Apply an authoritative MP payment to our payments row + its order. Idempotent;
 * WhatsApp is only notified on an actual status transition (no duplicate pings).
 */
export async function applyPaymentStatus(
  db: Db,
  pay: PaymentRow,
  payment: MpPayment,
): Promise<void> {
  const newStatus = mapPaymentStatus(payment.status);
  const transitioned = newStatus !== pay.status;

  await db
    .from("payments")
    .update({
      status: newStatus,
      mercadopago_payment_id: String(payment.id),
      raw: payment as unknown as Json,
      paid_at: payment.date_approved ??
        (newStatus === "approved" ? new Date().toISOString() : null),
    })
    .eq("id", pay.id);

  if (!pay.order_id) return;

  if (newStatus === "approved") {
    const { data: order } = await db
      .from("orders")
      .select("id, status, user_id, amount_cents")
      .eq("id", pay.order_id)
      .maybeSingle();
    if (!order) return;
    if (order.status === "cancelled" || order.status === "refunded") {
      console.warn(`settlement: orphan approved payment for terminal order ${order.id}`);
      return;
    }
    await db
      .from("orders")
      .update({ status: "paid", payment_expires_at: null })
      .eq("id", order.id);
    if (transitioned) {
      // Post account effects (puntos + notification) once, on the approval transition.
      try {
        await recordPaymentApproved(db, order, pay);
      } catch (e) {
        console.error("settlement: recordPaymentApproved failed", e);
      }
      if (pay.source === "whatsapp") {
        await notifyWhatsAppForOrder(
          db,
          order.id,
          "✅ ¡Pago confirmado! Tu pedido quedó pagado. ¡Gracias por tu compra! 🥚",
        );
      }
    }
  } else if (newStatus === "rejected" || newStatus === "cancelled") {
    await db
      .from("orders")
      .update({ status: "cancelled", payment_expires_at: null })
      .eq("id", pay.order_id)
      .eq("status", "awaiting_payment");
    if (transitioned && pay.source === "whatsapp") {
      await notifyWhatsAppForOrder(
        db,
        pay.order_id,
        "Tu pago no se completó. Si quieres, dime y te genero un nuevo link de pago. 🥚",
      );
    }
  }
}

/** Expire a still-pending hold (no successful MP payment found). */
export async function expireHold(db: Db, pay: PaymentRow): Promise<void> {
  await db.from("payments").update({ status: "expired" }).eq("id", pay.id);
  if (pay.order_id) {
    await db
      .from("orders")
      .update({ status: "cancelled", payment_expires_at: null })
      .eq("id", pay.order_id)
      .eq("status", "awaiting_payment");
  }
}
