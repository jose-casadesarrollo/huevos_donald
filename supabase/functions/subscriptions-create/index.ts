// Web entry to start a recurring subscription (MP preapproval, redirect flow).
// LOGIN REQUIRED: subscriptions are always tied to an authenticated user. The
// browser must send the user's Supabase access token as `Authorization: Bearer`.
// Returns the MP subscribeUrl where the customer enters their card.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createAdminClient } from "../_shared/supabase.ts";
import { createSubscriptionCheckout } from "../_shared/payments.ts";
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

  // Require a logged-in user. verify_jwt is off (so we can serve custom CORS),
  // so we validate the token ourselves and reject anonymous callers.
  const authHeader = req.headers.get("Authorization") ?? "";
  const token = authHeader.toLowerCase().startsWith("bearer ")
    ? authHeader.slice(7).trim()
    : "";
  if (!token) return json({ error: "auth required" }, 401);

  const db = createAdminClient();
  const { data: userData, error: authErr } = await db.auth.getUser(token);
  if (authErr || !userData?.user) return json({ error: "invalid session" }, 401);
  const user = userData.user;

  let body: { planId?: string; contactPhone?: string; deliveryZoneId?: string; payerEmail?: string };
  try {
    body = await req.json();
  } catch {
    return json({ error: "Bad Request" }, 400);
  }
  if (!body.planId) return json({ error: "planId required" }, 400);

  // Prefer the verified account email; allow an explicit override for billing.
  const email = (body.payerEmail ?? user.email ?? "").trim();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return json({ error: "valid payer email required" }, 400);
  }

  try {
    const sub = await createSubscriptionCheckout(db, {
      planId: body.planId,
      payerEmail: email,
      userId: user.id,
      contactPhone: body.contactPhone,
      deliveryZoneId: body.deliveryZoneId,
      source: "web",
    });
    return json({
      subscribeUrl: sub.subscribeUrl,
      preapprovalId: sub.preapprovalId,
      externalReference: sub.externalReference,
      amountLabel: formatCLP(sub.amountCents),
    });
  } catch (e) {
    console.error("subscriptions-create error", e);
    return json({ error: "could not create subscription" }, 502);
  }
});
