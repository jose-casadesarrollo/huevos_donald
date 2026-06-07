// payments-cleanup — minute cron (pg_cron -> pg_net http_post).
// Reconciles expired holds by RE-POLLING MercadoPago (never trusts the local
// clock alone): if MP shows an approved payment we settle it (a lost webhook),
// otherwise we expire the hold and free the order. Idempotent + CAS-guarded.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createAdminClient, type Db } from "../_shared/supabase.ts";
import { searchPaymentsByExternalRef } from "../_shared/mercadopago.ts";
import { applyPaymentStatus, expireHold, type PaymentRow } from "../_shared/settlement.ts";

const BATCH = 50;

function authorized(req: Request): boolean {
  const secret = Deno.env.get("CLEANUP_SECRET");
  if (!secret) {
    console.warn("payments-cleanup: CLEANUP_SECRET unset — allowing (dev only)");
    return true;
  }
  return req.headers.get("authorization") === `Bearer ${secret}`;
}

async function reconcileHold(db: Db, pay: PaymentRow, externalReference: string) {
  // Re-poll MP for any payment under our external_reference.
  const results = await searchPaymentsByExternalRef(externalReference);
  const approved = results.find((p) => p.status === "approved");
  if (approved) {
    await applyPaymentStatus(db, pay, approved); // webhook lost the race
    return "settled";
  }
  await expireHold(db, pay);
  return "expired";
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("ok");
  if (!authorized(req)) return new Response("unauthorized", { status: 401 });

  const db = createAdminClient();
  const summary = { expiredHolds: 0, settledLate: 0, expired: 0, errors: 0 };

  // Expired order holds: still awaiting payment past their window.
  const nowIso = new Date().toISOString();
  const { data: orders, error } = await db
    .from("orders")
    .select("id")
    .eq("status", "awaiting_payment")
    .lt("payment_expires_at", nowIso)
    .limit(BATCH);
  if (error) {
    console.error("payments-cleanup: orders query failed", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  for (const order of orders ?? []) {
    summary.expiredHolds++;
    try {
      // Newest pending hold payment for this order.
      const { data: pay } = await db
        .from("payments")
        .select("id, status, order_id, source, external_reference")
        .eq("order_id", order.id)
        .eq("status", "pending")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (!pay) {
        // No hold payment row — just free the order.
        await db
          .from("orders")
          .update({ status: "cancelled", payment_expires_at: null })
          .eq("id", order.id)
          .eq("status", "awaiting_payment");
        summary.expired++;
        continue;
      }
      const row: PaymentRow = {
        id: pay.id,
        status: pay.status,
        order_id: pay.order_id,
        source: pay.source,
      };
      const outcome = await reconcileHold(db, row, pay.external_reference);
      if (outcome === "settled") summary.settledLate++;
      else summary.expired++;
    } catch (e) {
      summary.errors++;
      console.error(`payments-cleanup: order ${order.id} reconcile failed`, e);
    }
  }

  return new Response(JSON.stringify(summary), {
    headers: { "Content-Type": "application/json" },
  });
});
