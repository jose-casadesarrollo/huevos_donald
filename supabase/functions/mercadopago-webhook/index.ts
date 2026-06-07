// MercadoPago webhook — the settlement spine.
// Flow: fail-closed x-signature verify -> dedup -> authoritative re-fetch from MP
// (never trust the body) -> idempotent settle of payments + order -> WhatsApp
// confirm when source='whatsapp'. Returns 200 for anything unrecoverable (so MP
// stops retrying) and 503 only for transient errors (so MP retries).
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createAdminClient, type Db } from "../_shared/supabase.ts";
import {
  getPayment,
  getPreapproval,
  mapSubscriptionStatus,
  MpApiError,
  type MpPayment,
  parseNotification,
  verifyWebhookSignature,
} from "../_shared/mercadopago.ts";
import { applyPaymentStatus } from "../_shared/settlement.ts";

const PROVIDER = "mercadopago";

async function isProcessed(db: Db, eventId: string): Promise<boolean> {
  const { data, error } = await db
    .from("processed_webhook_events")
    .select("id")
    .eq("provider", PROVIDER)
    .eq("event_id", eventId)
    .maybeSingle();
  if (error) {
    console.error("isProcessed error", error);
    return false;
  }
  return !!data;
}

async function markProcessed(db: Db, eventId: string): Promise<void> {
  const { error } = await db
    .from("processed_webhook_events")
    .insert({ provider: PROVIDER, event_id: eventId });
  if (error && error.code !== "23505") console.error("markProcessed error", error);
}

interface HandlerResult {
  code: 200 | 503;
}

async function handlePayment(db: Db, dataId: string): Promise<HandlerResult> {
  let payment: MpPayment;
  try {
    payment = await getPayment(dataId);
  } catch (e) {
    if (e instanceof MpApiError) {
      if (e.status === 404) return { code: 200 }; // stale/test id
      if (e.status === 401 || e.status === 403) {
        console.error("MP auth error on getPayment — check MP_ACCESS_TOKEN", e.body);
        return { code: 200 }; // don't hammer; config error to fix out of band
      }
      return { code: 503 }; // 5xx -> transient
    }
    return { code: 503 };
  }

  const ext = payment.external_reference;
  if (!ext) return { code: 200 };

  const { data: pay, error } = await db
    .from("payments")
    .select("id, status, order_id, source")
    .eq("external_reference", ext)
    .maybeSingle();
  if (error) return { code: 503 };
  if (!pay) return { code: 200 }; // not one of ours

  await applyPaymentStatus(db, pay, payment);
  return { code: 200 };
}

/**
 * On a subscription's first transition into `authorized`: credit the plan's eggs
 * (saldo), award renewal points, and queue a confirmation notification. Guarded by
 * the caller's `wasAuthorized` check + the webhook event dedup, so it runs once.
 * Points are skipped until `points_earn_rate` is configured (TBD).
 * TODO: per-cycle renewals (subscription_authorized_payment) should also credit
 * eggs/points — wire once the recurring-charge event path is finalized.
 */
async function recordSubscriptionActivated(
  db: Db,
  sub: { id: string; user_id: string; plan_id: string },
): Promise<void> {
  const { data: plan } = await db
    .from("plans")
    .select("quantity_per_delivery, price_cents")
    .eq("id", sub.plan_id)
    .maybeSingle();
  const qty = plan?.quantity_per_delivery ?? 0;
  if (qty > 0) {
    await db.from("egg_ledger").insert({
      user_id: sub.user_id,
      subscription_id: sub.id,
      delta: qty,
      reason: "plan_credit",
      note: "Activación de suscripción",
    });
  }
  await db.from("notification_events").insert({
    user_id: sub.user_id,
    event_type: "payment_confirmed",
    channel: "whatsapp",
    status: "pending",
    payload: { subscription_id: sub.id },
  });
  const { data: setting } = await db
    .from("app_settings")
    .select("value")
    .eq("key", "points_earn_rate")
    .maybeSingle();
  const rate = typeof setting?.value === "number" ? setting.value : null;
  if (rate && rate > 0 && plan?.price_cents) {
    const pts = Math.floor(Math.round(plan.price_cents / 100) * rate);
    if (pts > 0) {
      await db.from("points_ledger").insert({
        user_id: sub.user_id,
        subscription_id: sub.id,
        delta: pts,
        reason: "renewal",
      });
    }
  }
}

async function handleSubscription(db: Db, dataId: string): Promise<HandlerResult> {
  // dataId = preapproval id. Authoritative re-fetch, then sync subscription status.
  let pre;
  try {
    pre = await getPreapproval(dataId);
  } catch (e) {
    if (e instanceof MpApiError) {
      if (e.status === 404) return { code: 200 };
      if (e.status === 401 || e.status === 403) return { code: 200 };
      return { code: 503 };
    }
    return { code: 503 };
  }
  const status = mapSubscriptionStatus(pre.status);
  // Our subscriptions are keyed by mercadopago_subscription_id (the preapproval id).
  const { data: sub } = await db
    .from("subscriptions")
    .select("id, user_id, plan_id, status")
    .eq("mercadopago_subscription_id", String(pre.id))
    .maybeSingle();
  if (!sub) return { code: 200 }; // not one of ours
  const wasAuthorized = sub.status === "authorized";
  await db
    .from("subscriptions")
    .update({
      status,
      started_at: status === "authorized" ? new Date().toISOString() : undefined,
      cancelled_at: status === "cancelled" ? new Date().toISOString() : undefined,
    })
    .eq("id", sub.id);
  // First activation → credit saldo + points + notify (once).
  if (status === "authorized" && !wasAuthorized && sub.user_id) {
    try {
      await recordSubscriptionActivated(db, { id: sub.id, user_id: sub.user_id, plan_id: sub.plan_id });
    } catch (e) {
      console.error("mp-webhook: recordSubscriptionActivated failed", e);
    }
  }
  return { code: 200 };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok");
  if (req.method !== "POST") return new Response("ok"); // MP probes

  // Fail-closed signature verification (does not consume the body).
  if (!(await verifyWebhookSignature(req))) {
    return new Response("invalid signature", { status: 401 });
  }

  let body: { id?: number; type?: string; action?: string; data?: { id?: string } } | null;
  try {
    body = await req.json();
  } catch {
    body = null;
  }
  const { type, dataId } = parseNotification(body, req.url);
  if (!dataId) return new Response("ok");

  const db = createAdminClient();
  const eventId = String(body?.id ?? `${type}:${dataId}`);
  if (await isProcessed(db, eventId)) return new Response("ok (duplicate)");

  let result: HandlerResult = { code: 200 };
  try {
    if (type === "payment") {
      result = await handlePayment(db, dataId);
    } else if (
      type === "subscription_preapproval" ||
      type === "subscription_authorized_payment"
    ) {
      result = await handleSubscription(db, dataId);
    }
    // merchant_order / unknown -> ack (200)
  } catch (e) {
    console.error("mp-webhook handler error", e);
    result = { code: 503 };
  }

  if (result.code === 200) {
    await markProcessed(db, eventId);
    return new Response("ok");
  }
  return new Response("retry", { status: 503 });
});
