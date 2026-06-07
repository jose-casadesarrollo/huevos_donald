// Web Brick entry: turn an existing order into a MercadoPago preference and
// return what the browser needs to mount the Wallet Brick (or redirect to
// init_point). The order must already exist (created by the agent or storefront).
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createAdminClient } from "../_shared/supabase.ts";
import { createOrderPaymentLink } from "../_shared/payments.ts";
import { mpPublicKey } from "../_shared/mercadopago.ts";
import { formatCLP } from "../_shared/catalog.ts";
import { corsHeaders, preflight } from "../_shared/cors.ts";

Deno.serve(async (req) => {
  const pre = preflight(req);
  if (pre) return pre;
  const cors = corsHeaders(req.headers.get("origin"));
  const json = (b: unknown, status = 200) =>
    new Response(JSON.stringify(b), {
      status,
      headers: { ...cors, "Content-Type": "application/json" },
    });

  if (req.method !== "POST") return json({ error: "Method Not Allowed" }, 405);

  let body: { orderId?: string; payerEmail?: string };
  try {
    body = await req.json();
  } catch {
    return json({ error: "Bad Request" }, 400);
  }
  if (!body.orderId) return json({ error: "orderId required" }, 400);

  const db = createAdminClient();

  // Only allow paying orders that are open (not already paid/cancelled/etc.).
  const { data: order, error } = await db
    .from("orders")
    .select("id, status, amount_cents")
    .eq("id", body.orderId)
    .maybeSingle();
  if (error) return json({ error: "lookup failed" }, 500);
  if (!order) return json({ error: "order not found" }, 404);
  if (!["pending", "awaiting_payment"].includes(order.status)) {
    return json({ error: `order not payable (status: ${order.status})` }, 409);
  }
  if (order.amount_cents <= 0) return json({ error: "order amount is zero" }, 409);

  try {
    const pay = await createOrderPaymentLink(db, {
      orderId: order.id,
      source: "web",
      payerEmail: body.payerEmail,
    });
    return json({
      preferenceId: pay.preferenceId,
      publicKey: mpPublicKey(),
      externalReference: pay.externalReference,
      initPoint: pay.paymentUrl,
      amountLabel: formatCLP(pay.amountCents),
      expiresAt: pay.expiresAt,
    });
  } catch (e) {
    console.error("payments-create error", e);
    return json({ error: "could not create payment" }, 502);
  }
});
