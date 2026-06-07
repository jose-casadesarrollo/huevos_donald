# MercadoPago × Supabase Edge (Deno, raw fetch) — CHILE / CLP build reference

Verified against the live MercadoPago API (June 2026). The canonical `mercadopago.cl` reference SPA blocks programmatic fetch (HTTP 403 Cloudflare); JSON shapes below come from the identical `.com.co/.com.ar/.com.mx` mirrors + the official Go/Node SDK structs. Re-verify field-by-field in a browser before shipping, per AGENTS.md.

## 0. THE MONEY RULE (read first — this is the 100x bug surface)

Your DB stores `amount_cents bigint` = **pesos × 100** (`orders.amount_cents`, `payments.amount_cents`). **CLP is a ZERO-DECIMAL currency.** MercadoPago expects the *integer number of pesos*, never cents, never decimals.

```ts
// THE ONLY correct conversion. Use this everywhere you build an MP amount.
const mpAmount = Math.round(amountCents / 100); // amount_cents=499000 -> 4990 (CLP $4.990)
// unit_price / transaction_amount = mpAmount   (integer, NOT 4990.00, NOT 499000)
```

100x bug map — every place this can go wrong:
- **Sending `amount_cents` raw** (`499000`) instead of `Math.round(amount_cents/100)` → charges 100× too much. Most dangerous single line.
- **Sending pesos×100 thinking MP wants cents** (USD/EUR habit) → 100× overcharge. MP does NOT use minor units for CLP.
- **Sending a decimal** (`4990.00`, `49.90`) for CLP → "processing error" / silent misprice. MP rejects/mishandles decimals on CLP.
- **Reading back `transaction_amount` and multiplying by 100 to store cents** is correct (`4990 → 499000`), but note the GET response sometimes returns `transaction_amount` as a **string** (`"4990"` or even `"24.50"` in MXN doc examples) — parse with `Math.round(Number(x) * 100)` defensively, never `parseInt` a decimal string.
- **JS float**: `Math.round` before the network call; do not let `amount_cents/100` leak a `.999...`.
- Minimum CLP charge is ~10. Reject `mpAmount < 50` for Webpay (its own floor) before calling MP.

Guard to drop in:
```ts
function clpFromCents(amountCents: number): number {
  if (!Number.isInteger(amountCents) || amountCents < 0) throw new Error(`bad amount_cents ${amountCents}`);
  const clp = Math.round(amountCents / 100);
  if (clp < 1) throw new Error(`CLP amount underflow from ${amountCents}`);
  return clp; // integer pesos
}
```

---

## 1. AUTH + BASE URL

- **Base host (always):** `https://api.mercadopago.com` — same host for test and production. The **token** decides the environment, not a flag or a different host.
- **Header:** `Authorization: Bearer <ACCESS_TOKEN>` plus `Content-Type: application/json`.
- **Token prefixes:** `APP_USR-...` = production access token. `TEST-...` = test/sandbox token. The webhook body's `live_mode` boolean tells you which env a notification came from.
- **Secret handling:** the access token is a server-only secret (like your `SUPABASE_SERVICE_ROLE_KEY`). Read it via `Deno.env.get(...)` inside the Edge Function — **never** ship it to the browser. Tokenization (card → token) uses the **public key** client-side only.

Mirror your existing env pattern (`createAdminClient` style):
```ts
function mpToken(): string {
  const t = Deno.env.get("MP_ACCESS_TOKEN");
  if (!t) throw new Error("Missing MP_ACCESS_TOKEN in the edge function environment.");
  return t; // APP_USR-... in prod, TEST-... in sandbox
}
const MP = "https://api.mercadopago.com";
function mpHeaders(extra: Record<string, string> = {}) {
  return { Authorization: `Bearer ${mpToken()}`, "Content-Type": "application/json", ...extra };
}
```

Secrets to add (via `supabase secrets set`): `MP_ACCESS_TOKEN`, `MP_WEBHOOK_SECRET` (per-app, from dashboard → Your integrations → Webhooks, generated only after you Save the webhook config). Optionally `MP_PUBLIC_BASE_URL` for back_urls/notification_url.

> Webhook function config: set `verify_jwt = false` in `config.toml` (same as your `agent-whatsapp`/`agent-chat`) — MercadoPago does not send a Supabase JWT. Auth is the HMAC x-signature check instead.

---

## 2. CHECKOUT PRO — createPreference (one-time order pay link)

`POST https://api.mercadopago.com/checkout/preferences` → returns `{ id, init_point, sandbox_init_point, ... }`. Redirect the buyer's browser to `init_point` (prod) / `sandbox_init_point` (test).

**Required:** `items[]` with `title`, `quantity`, `unit_price` (+ `currency_id` "CLP"). **If you set `auto_return` you MUST also set `back_urls.success`** or you get `invalid_auto_return: 'auto_return invalid. back_url.success must be defined'`.

```ts
// external_reference: use your payments.external_reference (uuid) — it's already the
// unique join key in your schema (uq_payments_external_reference).
async function createPreference(opts: {
  amountCents: number; title: string; quantity: number;
  externalReference: string;        // payments.external_reference (uuid)
  payerEmail?: string;
  notificationUrl: string;          // https public URL, NO localhost
  successUrl: string; pendingUrl: string; failureUrl: string;
  expiresAt?: string;               // ISO-8601 with ms+offset
}) {
  const unit_price = clpFromCents(opts.amountCents); // INTEGER CLP — the 100x guard
  const pref = {
    items: [{
      id: opts.externalReference,
      title: opts.title,
      quantity: opts.quantity,            // integer
      currency_id: "CLP",                 // Chile
      unit_price,                         // INTEGER pesos, e.g. 4990
    }],
    ...(opts.payerEmail ? { payer: { email: opts.payerEmail } } : {}),
    external_reference: opts.externalReference,
    notification_url: opts.notificationUrl,
    back_urls: { success: opts.successUrl, pending: opts.pendingUrl, failure: opts.failureUrl },
    auto_return: "approved",              // ONLY valid value; requires back_urls.success
    binary_mode: false,                   // see gotcha below — leave false for Webpay/transfer
    metadata: { external_reference: opts.externalReference, source: "agent" }, // snake_case keys
    ...(opts.expiresAt ? {
      expires: true,
      expiration_date_from: new Date().toISOString().replace("Z", "-00:00"), // see ISO gotcha
      expiration_date_to: opts.expiresAt,
    } : {}),
    // Optional CL tuning:
    // payment_methods: { excluded_payment_types: [{ id: "ticket" }], installments: 1 },
    // statement_descriptor: "HUEVOSDONALD",
  };
  const res = await fetch(`${MP}/checkout/preferences`, {
    method: "POST",
    headers: mpHeaders({ "X-Idempotency-Key": opts.externalReference }), // stable per order
    body: JSON.stringify(pref),
  });
  if (!res.ok) throw new Error(`MP preference ${res.status}: ${await res.text()}`);
  return await res.json() as { id: string; init_point: string; sandbox_init_point: string };
}
```

Verbatim response shape (201):
```json
{
  "id": "202809963-920c288b-4ebb-40be-966f-700250fa5370",
  "init_point": "https://www.mercadopago.com/mla/checkout/start?pref_id=...",
  "sandbox_init_point": "https://sandbox.mercadopago.com/mla/checkout/pay?pref_id=...",
  "collector_id": 202809963,
  "client_id": "6295877106812064",
  "date_created": "2022-11-17T10:37:52.000-05:00"
}
```

Store on `payments`: `mp_preference_id = id`, `mp_init_point = init_point` (or sandbox in test), `expires_at`. You already have these columns. Then redirect or hand `init_point` to the client.

### Field reference (createPreference)
| Field | Type | Notes |
|---|---|---|
| `items[].title` / `quantity` / `unit_price` | string / int / **int (CLP)** | required; `unit_price` integer pesos |
| `items[].currency_id` | string | `"CLP"` |
| `items[].id` / `description` / `picture_url` / `category_id` | string | optional |
| `payer.email` / `name` / `surname` | string | prefills checkout |
| `payer.identification` | `{ type, number }` | Chile type = `"RUT"`, number e.g. `"12345678-9"` |
| `back_urls` | `{ success, pending, failure }` | public HTTPS; `success` required if `auto_return` set |
| `auto_return` | string | only `"approved"`; redirect-mode only, not modal; up to 40s delay |
| `notification_url` | string | webhook endpoint |
| `external_reference` | string | your `payments.external_reference` uuid |
| `metadata` | object | snake_case keys; echoed back |
| `binary_mode` | bool | default false |
| `expires` / `expiration_date_from` / `expiration_date_to` | bool / ISO / ISO | expiry window |
| `payment_methods` | object | `excluded_payment_methods[{id}]`, `excluded_payment_types[{id}]`, `installments` (1–36), `default_payment_method_id` |
| `statement_descriptor` | string | card statement text |

### createPreference gotchas
- **`auto_return` requires `back_urls.success`** — hard error otherwise.
- **No localhost / 127.0.0.1** in `back_urls` or `notification_url` — MP rejects local domains. Use the Supabase Functions/site public URL.
- **`auto_return` redirect only works in redirect/mobile opening mode, not modal**; redirect delay up to ~40s, not customizable.
- **Sandbox vs prod is token-driven.** TEST token → use `sandbox_init_point`. APP_USR token → use `init_point`. No toggle.
- **back_url query params on return** (informational only): `payment_id`, `status`, `external_reference`, `merchant_order_id`, `collection_id`, `collection_status`, `payment_type`, `preference_id`, `site_id`, `processing_mode`. **Never confirm an order from these** — confirm via webhook + `GET /v1/payments/{id}`.
- **`binary_mode=true`** forces approved/rejected only and **can lower approval rate**; it auto-rejects what would be pending/in_process. **Bad for Chile** where Webpay/bank-transfer/ticket are inherently async (pending) — leave `false` for Checkout Pro. Only use binary_mode for instant card-only flows.
- **`X-Idempotency-Key`** on the POST prevents duplicate preferences on retry; reusing the key returns the original. Use your stable `external_reference` so retries don't mint duplicates.
- **AMBIGUOUS:** the public doc example uses `currency_id: "COP"` and `unit_price: 24.5` (a decimal) — that is **Colombia**, NOT a template for Chile. Do not copy the decimal. CLP must be integer.
- **AMBIGUOUS:** the `mercadopago.cl` reference page 403s automated fetch and the live `/currencies/CLP` endpoint now also 403s without auth, so `decimal_places=0` for CLP is confirmed only via docs prose, not a live API read. Treat the integer rule as authoritative anyway.

### ISO expiration gotcha (subtle 400 source)
Docs format is `yyyy-MM-dd'T'HH:mm:ss.SSSZ` **with a numeric offset**, e.g. `2026-06-30T12:00:00.000-04:00`. JS `Date.toISOString()` emits `...Z` (UTC). MP generally accepts the `Z` form but the documented examples always use an explicit offset. If you hit a 400 on expiration, convert `Z` → `-00:00`. Chile is `America/Santiago` (offset shifts with DST: -04:00 / -03:00) — compute the offset, don't hardcode.

---

## 3. PAYMENTS API — getPayment, search by external_reference, createPayment

### 3a. getPayment — `GET /v1/payments/{id}`
`{id}` is **MercadoPago's numeric payment id**, NOT your `external_reference`. This is the authoritative status read after a webhook.
```ts
async function getPayment(paymentId: string | number) {
  const res = await fetch(`${MP}/v1/payments/${paymentId}`, { headers: mpHeaders() });
  if (!res.ok) throw new Error(`MP getPayment ${res.status}: ${await res.text()}`);
  return await res.json();
}
```
Verbatim response shape (MXN in docs — for Chile `currency_id` is `"CLP"` and `transaction_amount` is integer pesos):
```json
{
  "id": 1,
  "date_created": "2017-08-31T11:26:38.000Z",
  "date_approved": "2017-08-31T11:26:38.000Z",
  "date_last_updated": "2017-08-31T11:26:38.000Z",
  "money_release_date": "2017-09-14T11:26:38.000Z",
  "payment_method_id": "master",
  "payment_type_id": "credit_card",
  "status": "approved",
  "status_detail": "accredited",
  "currency_id": "MXN",
  "transaction_amount": "24.50",
  "collector_id": 2,
  "external_reference": "MP0001"
}
```
Storing back: `payments.amount_cents = Math.round(Number(transaction_amount) * 100)`. For CLP `transaction_amount` is integer pesos (`4990`) → `499000` cents. **Note the example shows `transaction_amount` as a STRING** — always `Number()` it; never assume numeric.

### 3b. searchByExternalReference — `GET /v1/payments/search`
There is **no GET-by-external_reference single endpoint**. Search returns an envelope; handle 0 / 1 / many (a buyer retrying produces multiple payment rows for one order).
```ts
async function searchPaymentsByExternalRef(externalReference: string) {
  const u = new URL(`${MP}/v1/payments/search`);
  u.searchParams.set("external_reference", externalReference);
  u.searchParams.set("sort", "date_created");
  u.searchParams.set("criteria", "desc");
  u.searchParams.set("limit", "10");
  const res = await fetch(u, { headers: mpHeaders() });
  if (!res.ok) throw new Error(`MP search ${res.status}: ${await res.text()}`);
  const { paging, results } = await res.json() as { paging: { total: number; limit: number; offset: number }; results: any[] };
  return results; // pick the approved one, or latest
}
```
Verbatim envelope:
```json
{ "paging": { "total": 1234, "limit": 30, "offset": 0 }, "results": [ /* full payment objects */ ] }
```
Other filters: `status`, `status_detail`, `payment_method_id`, `payer.id`, `operation_type`, `offset`, `begin_date`/`end_date`/`range`. Search covers ~last 12 months.

### 3c. createPayment — `POST /v1/payments` (direct card charge)
**Only needed if you build a card form (Checkout Bricks/Transparente).** Checkout Pro (Section 2) does NOT use this. The `token` is a single-use, short-lived card token **minted client-side** with the public key — you cannot create it server-side from the access token.
```ts
async function createCardPayment(opts: {
  amountCents: number; cardToken: string; paymentMethodId: string; // "visa","master",...
  installments: number; payerEmail: string; externalReference: string;
  idempotencyKey: string;     // persist with the order; reuse on retry
  notificationUrl: string;
}) {
  const body = {
    transaction_amount: clpFromCents(opts.amountCents), // INTEGER CLP
    token: opts.cardToken,
    description: "Pedido Huevos Donald",
    installments: opts.installments,            // CLP commonly 1
    payment_method_id: opts.paymentMethodId,
    external_reference: opts.externalReference,
    notification_url: opts.notificationUrl,
    binary_mode: false,
    payer: { email: opts.payerEmail, identification: { type: "RUT", number: "12345678-9" } },
  };
  const res = await fetch(`${MP}/v1/payments`, {
    method: "POST",
    headers: mpHeaders({ "X-Idempotency-Key": opts.idempotencyKey }), // MANDATORY
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`MP createPayment ${res.status}: ${await res.text()}`);
  return await res.json(); // 201
}
```

### Payments gotchas
- **`X-Idempotency-Key` is MANDATORY on POST /v1/payments** (enforced since 2024). Generate ONCE per logical attempt and **persist it** (e.g. `crypto.randomUUID()` stored with the order). **Do NOT regenerate on retry** — reusing the same key returns the first result instead of double-charging. (This is the dedup mechanism; without it, a retry storm = duplicate charges.)
- **`transaction_amount` integer CLP** — see Section 0. Min ~10.
- **`token` is single-use, client-minted, short-lived.** Server cannot mint it. For server-only flows without a card form, use methods that need no token (`account_money`, `ticket`, `bank_transfer`/Webpay) — but those go through Checkout Pro, not this endpoint.
- **Don't trust the 201 as terminal** when `binary_mode=false` — status may be `in_process`/`pending`. Confirm via webhook + re-GET.
- **`transaction_amount` may come back as a string** in responses — `Number()` it before storing as cents.
- Two-step capture: `authorized/pending_capture` → `PUT /v1/payments/{id}` body `{"capture": true}`; cancel via `{"status": "cancelled"}`.

### Status / status_detail you must handle
`status`: `approved | pending | authorized | in_process | in_mediation | rejected | cancelled | refunded | charged_back`.

Map to your `payment_status` (which now includes `cancelled`, `expired`):
- `approved/accredited` → paid. `approved/partially_refunded` → partial.
- `authorized/pending_capture` → two-step; capture or it expires.
- `in_process/pending_contingency | pending_review_manual | offline_process` → keep awaiting.
- `pending/pending_waiting_payment | pending_waiting_transfer | pending_challenge`(3DS) → awaiting (Webpay/transfer normal).
- `cancelled/expired | by_collector | by_payer` → map to `cancelled`/`expired`.
- `rejected/cc_rejected_insufficient_amount | bad_filled_card_number | high_risk | 3ds_challenge | call_for_authorize | rejected_by_bank | other_reason` → failed; surface reason, allow retry.
- `refunded`, `charged_back/in_process|settled|reimbursed` → reconcile.

---

## 4. WEBHOOK x-signature — EXACT manifest + HMAC-SHA256 verification

MercadoPago POSTs to your `notification_url` with `data.id` and `type` ALSO appended as **query params** (`?data.id=123456&type=payment`). You must read the JSON body AND the headers `x-signature` + `x-request-id`.

**`x-signature` header format (verbatim example):**
```
ts=1704908010,v1=618c85345248dd820d5fd456117c2ab2ef8eda45a0282ff693eac24131a5e839
```

**THE EXACT MANIFEST TEMPLATE (verbatim from docs — position- and punctuation-sensitive):**
```
id:[data.id_url];request-id:[x-request-id_header];ts:[ts_header];
```
Filled example (verbatim):
```
id:999999999;request-id:abc123;ts:1704908010;
```

Manifest rules, verbatim intent:
1. `[data.id_url]` = the `data.id` value from the **URL query param** (`urlParams.get('data.id')`). **Lowercase it if alphanumeric** (numeric payment ids are unaffected; order/merchant/preapproval ids can be alphanumeric — this is a top "works in test, fails in prod" cause).
2. `[x-request-id_header]` = the `x-request-id` header value.
3. `[ts_header]` = the `ts` parsed from `x-signature`.
4. **Each segment ends with `;`, INCLUDING a trailing `;` after `ts`.** Any deviation breaks the HMAC.
5. **OMIT a whole segment** (e.g. `request-id:...;`) if its value is absent — do NOT leave an empty placeholder.

Then: `HMAC_SHA256(secret = MP_WEBHOOK_SECRET, message = manifest)` in hex, **constant-time compare** to `v1`.

**Official Node.js sample (verbatim — note it's written for a browser/Node, you must adapt to Deno):**
```js
const xSignature = headers['x-signature'];
const xRequestId = headers['x-request-id'];
const urlParams = new URLSearchParams(window.location.search);
const dataID = urlParams.get('data.id');
const parts = xSignature.split(',');
let ts; let hash;
parts.forEach(part => {
  const [key, value] = part.split('=');
  if (key && value) {
    const trimmedKey = key.trim();
    const trimmedValue = value.trim();
    if (trimmedKey === 'ts') { ts = trimmedValue; }
    else if (trimmedKey === 'v1') { hash = trimmedValue; }
  }
});
const secret = 'your_secret_key_here';
const manifest = `id:${dataID};request-id:${xRequestId};ts:${ts};`;
const hmac = crypto.createHmac('sha256', secret);
hmac.update(manifest);
const sha = hmac.digest('hex');
if (sha === hash) { console.log("HMAC verification passed"); }
else { console.log("HMAC verification failed"); }
```

**Deno/Web Crypto adaptation (Edge-ready — verify locally before shipping):**
```ts
function parseXSignature(h: string | null): { ts: string; v1: string } | null {
  if (!h) return null;
  let ts = "", v1 = "";
  for (const part of h.split(",")) {
    const [k, ...rest] = part.split("=");
    const v = rest.join("=").trim();
    const key = k.trim();
    if (key === "ts") ts = v; else if (key === "v1") v1 = v;
  }
  return ts && v1 ? { ts, v1 } : null;
}

function timingSafeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

async function verifyMpSignature(req: Request): Promise<boolean> {
  const secret = Deno.env.get("MP_WEBHOOK_SECRET");
  if (!secret) throw new Error("Missing MP_WEBHOOK_SECRET");
  const sig = parseXSignature(req.headers.get("x-signature"));
  const requestId = req.headers.get("x-request-id");
  // data.id from the URL query param (matches MP's signing input exactly)
  let dataId = new URL(req.url).searchParams.get("data.id");
  if (!sig || !dataId) return false;
  if (/[a-z]/i.test(dataId)) dataId = dataId.toLowerCase(); // lowercase if alphanumeric

  // Replay protection: reject stale (ts is Unix SECONDS in examples)
  const ageSec = Math.abs(Date.now() / 1000 - Number(sig.ts));
  if (!Number.isFinite(ageSec) || ageSec > 300) return false; // 5-min tolerance

  // Build manifest; OMIT request-id segment entirely if absent
  const manifest = requestId
    ? `id:${dataId};request-id:${requestId};ts:${sig.ts};`
    : `id:${dataId};ts:${sig.ts};`;

  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const buf = await crypto.subtle.sign("HMAC", key, enc.encode(manifest));
  const hex = [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, "0")).join("");
  return timingSafeEqualHex(hex, sig.v1);
}
```

**Notification JSON body (verbatim example):**
```json
{
  "id": 12345,
  "live_mode": true,
  "type": "payment",
  "date_created": "2015-03-25T10:04:58.396-04:00",
  "user_id": 44444,
  "api_version": "v1",
  "action": "payment.created",
  "data": { "id": "999999999" }
}
```

**Handler skeleton (response contract + idempotency):**
```ts
Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("ok"); // MP also probes
  if (!(await verifyMpSignature(req))) return new Response("invalid signature", { status: 401 });

  const body = await req.json();
  const type = body.type ?? new URL(req.url).searchParams.get("type");
  const dataId = body?.data?.id ?? new URL(req.url).searchParams.get("data.id");

  // ACK FAST (MP waits ~22s; on non-2xx it retries every 15 min, 3x then widening).
  // Dedup by (type, data.id) — MP can deliver duplicates AND separate payment +
  // merchant_order events for one transaction. Persist+enqueue, then do work.
  switch (type) {
    case "payment": {
      const payment = await getPayment(dataId);            // authoritative status
      // reconcile via payment.external_reference -> your payments row
      break;
    }
    case "merchant_order": { /* GET /merchant_orders/{dataId} */ break; }
    case "subscription_preapproval":
    case "subscription_authorized_payment": { /* GET /preapproval/{dataId} */ break; }
  }
  return new Response("ok", { status: 200 }); // 200/201 = ACK
});
```

### Webhook gotchas (precise)
- **Manifest is position + punctuation sensitive**, trailing `;` after `ts` included.
- **Lowercase alphanumeric `data.id`** before building manifest.
- **OMIT, don't blank, missing segments.**
- **`data.id` from the URL query param** (`new URL(req.url).searchParams.get('data.id')`) — the sample's `window.location` does NOT exist server-side. The query-param value is MP's actual signing input.
- **`ts` is Unix SECONDS** (`1704908010` = Jan 2024). Use for both manifest and replay rejection.
- **Secret is per-app**, generated only after Saving webhook config; rotatable via Reset (invalidates old signatures). Test vs prod can have different URLs.
- **Constant-time compare** (`timingSafeEqualHex`) — docs use `===`, but don't.
- **Return 2xx fast**; MP retries on non-2xx → duplicate deliveries. Handler **must be idempotent** (dedup on `type`+`data.id`).
- **NEVER trust the body for status/amount** — the body carries no amount/currency; re-GET the resource. (Also why CLP money rules don't touch the webhook itself.)
- **CLP on re-GET:** `transaction_amount` is integer pesos — do NOT ×100 to "fix decimals"; ×100 only to convert pesos→your `amount_cents`.
- `type` = topic (pick fetch endpoint); `action` (`payment.created`/`payment.updated`) = business event.
- **Legacy IPN** (`?topic=...&id=...`, unsigned) is a different model — don't mix validators. Use signed Webhooks.

---

## 5. SUSCRIPCIONES via preapproval (plan + subscription + recurring + webhooks)

Two objects: **`preapproval_plan`** = reusable template (frequency/amount/currency, optional free_trial/billing_day/repetitions) — it charges nobody. **`preapproval`** = the actual subscription tying a `payer_email` (+ payment method) to a config; this is what generates recurring invoices. `preapproval_plan_id` is **OPTIONAL** on `POST /preapproval` (you can subscribe with or without a plan).

### 5a. Create plan — `POST /preapproval_plan`
```ts
async function createPlan(opts: { reason: string; amountCents: number; backUrl: string; frequency?: number; }) {
  const body = {
    reason: opts.reason,
    auto_recurring: {
      frequency: opts.frequency ?? 1,
      frequency_type: "months",         // or "days"
      // repetitions: 12,               // omit for indefinite
      // billing_day: 10,               // 1-28, months only
      // billing_day_proportional: true,
      // free_trial: { frequency: 1, frequency_type: "months" },
      transaction_amount: clpFromCents(opts.amountCents), // INTEGER CLP
      currency_id: "CLP",
    },
    back_url: opts.backUrl,
  };
  const res = await fetch(`${MP}/preapproval_plan`, { method: "POST", headers: mpHeaders(), body: JSON.stringify(body) });
  if (!res.ok) throw new Error(`MP plan ${res.status}: ${await res.text()}`);
  return await res.json(); // -> { id, ... } use id as preapproval_plan_id
}
```

### 5b. Create subscription — `POST /preapproval` (two flows)

**Flow A — WITHOUT card → redirect (recommended for agent/Telegram/web).** Omit `card_token_id`, `status: "pending"`. MP returns `init_point`; redirect the payer to enter a card on MP's hosted checkout. After they authorize, status → `authorized`.
```ts
async function createSubscriptionRedirect(opts: {
  reason: string; amountCents: number; payerEmail: string;
  externalReference: string; backUrl: string; planId?: string;
}) {
  const body = {
    ...(opts.planId ? { preapproval_plan_id: opts.planId } : {}),
    reason: opts.reason,                  // required when no plan
    external_reference: opts.externalReference,
    payer_email: opts.payerEmail,         // REQUIRED
    auto_recurring: {                     // required when no plan
      frequency: 1, frequency_type: "months",
      transaction_amount: clpFromCents(opts.amountCents), // INTEGER CLP
      currency_id: "CLP",
      // start_date / end_date optional ISO-8601
    },
    back_url: opts.backUrl,               // required for redirect flow
    status: "pending",
  };
  const res = await fetch(`${MP}/preapproval`, { method: "POST", headers: mpHeaders(), body: JSON.stringify(body) });
  if (!res.ok) throw new Error(`MP preapproval ${res.status}: ${await res.text()}`);
  const sub = await res.json();
  return sub; // redirect buyer to sub.init_point (prod) / sub.sandbox_init_point (test)
}
```

**Flow B — WITH saved card → auto-charge (no redirect).** Provide client-minted `card_token_id` + `status: "authorized"`. The engine auto-schedules and charges automatically (first charge ~1h after creation); `init_point` is informational. Card is saved (`card_id`) for future cycles.
```json
{
  "preapproval_plan_id": "2c938084726fca48...",
  "reason": "Suscripción huevos",
  "external_reference": "sub-uuid",
  "payer_email": "test@testuser.com",
  "card_token_id": "{{CARD_TOKEN}}",
  "auto_recurring": { "frequency": 1, "frequency_type": "months", "transaction_amount": 9990, "currency_id": "CLP" },
  "back_url": "https://app/sub/back",
  "status": "authorized"
}
```

**Response shape (from official sdk-go struct, verbatim tags; CL `init_point` is on mercadopago.cl):**
```json
{
  "id": "...", "version": 0, "application_id": 0, "collector_id": 0,
  "payer_id": 0, "payer_email": "...", "back_url": "...",
  "status": "pending|authorized|paused|cancelled", "reason": "...",
  "external_reference": "...",
  "init_point": "https://www.mercadopago.cl/subscriptions/checkout?preapproval_id=...",
  "sandbox_init_point": "...", "preapproval_plan_id": "...",
  "payment_method_id": "...", "card_id": "...", "next_payment_date": "...",
  "date_created": "...", "last_modified": "...", "first_invoice_offset": 0,
  "auto_recurring": { "frequency": 1, "frequency_type": "months", "currency_id": "CLP", "transaction_amount": 0, "free_trial": {} },
  "summarized": { "quotas": 0, "charged_quantity": 0, "charged_amount": 0, "pending_charge_quantity": 0, "pending_charge_amount": 0, "last_charged_date": "...", "last_charged_amount": 0, "semaphore": "..." }
}
```

### 5c. Manage / read
- `GET /preapproval/{id}` — read current status (use in webhook handler).
- `PUT /preapproval/{id}` — `{ "status": "paused" }` / `"cancelled"` (terminal, not reactivatable) / `"authorized"`; also assign `card_token_id` to a pending sub.
- `GET /preapproval/search?payer_email=...&preapproval_plan_id=...&status=...` — dedup before re-creating.
- `GET /authorized_payments/{id}` — a single recurring invoice/charge.

### 5d. Recurring charge lifecycle
- Subscription status: `pending → authorized (active) → paused (resumable) / cancelled (terminal)`.
- Invoice (`authorized_payment`) status: `scheduled → recycling` (on decline, up to ~4 retries over ~10 days) `→ processed` (final); also `waiting for gateway`.

### 5e. Subscription webhook topics
Enable explicitly in the panel: **`subscription_preapproval`** (sub created/updated — status changes), **`subscription_preapproval_plan`** (plan changes), **`subscription_authorized_payment`** (a recurring invoice created/updated). MP recommends ALSO enabling **`payment`** to catch the underlying charge. Same x-signature/manifest validation as Section 4 (`data.id` = the preapproval/authorized_payment id). Body is thin — re-GET the resource for real status.

Notification body example:
```json
{ "id": 12345, "live_mode": true, "type": "subscription_preapproval",
  "date_created": "2015-03-25T10:04:58.396-04:00", "user_id": 44444,
  "api_version": "v1", "action": "updated", "data": { "id": "<preapproval_id>" } }
```

### Subscription gotchas
- **CLP integer** for `auto_recurring.transaction_amount` (use `clpFromCents`). Min ~10.
- **`payer_email` required**; **`reason` + `auto_recurring` required when no plan**; **`back_url` required for the redirect (pending) flow**.
- **`init_point` returned for both flows** but is only the actionable redirect for `status: "pending"`. Use `sandbox_init_point` in test.
- **`card_token_id` is single-use, client-minted** with the public key; MP saves the card (`card_id`) so future cycles reuse it.
- **No `X-Idempotency-Key` on subscription create** in these examples — dedup on YOUR side via `external_reference` and/or `GET /preapproval/search?payer_email=...` before re-creating (a duplicate POST = duplicate subscription).
- `cancelled` is **terminal** — cannot reactivate.
- `billing_day` only with `frequency_type: "months"`; pair with `billing_day_proportional` to prorate the first cycle. `free_trial` defers first real charge.
- **AMBIGUOUS:** doc examples use `currency_id: "ARS"`/`"BRL"` and `transaction_amount: 10` — swap to `"CLP"` and your integer amount; don't copy the example currency.

---

## 6. CHILE / CLP gotchas + test users

### Currency / market
- **CLP zero-decimal/integer everywhere** (Section 0). `site_id` for Chile = **`MLC`**. `currency_id` = **`CLP`**. Identification type = **`RUT`** (`"12345678-9"`). Phones `+56` / `56XXXXXXXXX` (your `orders_phone_e164_chk` is `^56[0-9]{8,9}$`). Timezone `America/Santiago`.
- **Chile payment methods (Checkout Pro):** credit (Visa/Mastercard/Amex), Redcompra **debit**, prepaid, **Redcompra Webpay** (type `bank_transfer`, id "Redcompra Webpay", min 50 / max 3,000,000 CLP, **auto-cancels if unpaid within 30 min**), and Mercado Pago account money / wallet. **Account money & wallet CANNOT be excluded** via `excluded_payment_types`. Confirm exact ids via `GET /v1/payment_methods` with a CL token.
- Because Webpay/transfer are async → **leave `binary_mode: false`** for Checkout Pro and expect `pending` states; finalize via webhook.

### Test users — `POST /users/test`
Buyer and seller must be **same country (MLC)**. Max 15 test users.
```bash
curl -X POST 'https://api.mercadopago.com/users/test' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer APP_USR-...' \
  -d '{ "site_id": "MLC", "description": "Comprador test CL" }'
# -> { "id":123, "nickname":"TEST...", "password":"qatest...", "site_status":"active", "site_id":"MLC", "email":"test_user_xxx@testuser.com" }
```
Create a **test SELLER** (use its token to create preferences) and a **test BUYER** (log into the checkout with its email/password).

### Test cards (valid for CL testing) — CVV `123`, expiry `11/30`
- Mastercard credit: `5254 1336 7440 3564`
- Visa credit: `4013 5406 8274 6260`
- Visa debit: `4915 1120 5524 6507`

Force outcomes via **CARDHOLDER NAME** (document `123456789`): `APRO`=approved, `OTHE`=rejected (general), `CONT`=pending, `CALL`=auth required, `FUND`=insufficient funds, `SECU`=invalid CVV, `EXPI`=expiry problem, `FORM`=form error.

### Credentials / fetch gotchas
- `APP_USR-...` prod, `TEST-...` test; test creds need no activation. Access token = backend only; public key = frontend.
- `www.mercadopago.cl` and `api.mercadopago.com/currencies/*` **403 anonymous fetch** (Cloudflare). Use `.com.co/.com.ar/.com.mx` doc mirrors (append `.md` for markdown); reference SPA pages need a browser.
- 2023/2024 changes still live in 2026: `X-Idempotency-Key` mandatory on Payments/Refunds; webhook x-signature HMAC required. Both apply here.

---

## Mapping to YOUR schema (grounding)
- `payments.external_reference` (uuid, unique `uq_payments_external_reference`) → MP `external_reference` + a stable `X-Idempotency-Key`.
- `payments.mp_preference_id`, `payments.mp_init_point`, `payments.expires_at` → fill from createPreference response.
- `payments.mercadopago_payment_id` (now nullable) → set from webhook `data.id` / search result.
- `payments.amount_cents`, `orders.amount_cents` (bigint, pesos×100) → ALWAYS `Math.round(amount_cents/100)` outbound; `Math.round(Number(transaction_amount)*100)` inbound.
- `payment_status` now has `cancelled`/`expired` → map MP `cancelled/*` and expiry there.
- `orders.payment_expires_at` + `idx_orders_awaiting_payment_expiry` + `pg_net` cron → your hold-cleanup/reconcile path (poll `GET /v1/payments/search?external_reference=...` for orders past expiry).
- Webhook function: add `[functions.mp-webhook] verify_jwt = false` to `config.toml` (mirror `agent-whatsapp`). Reuse `Deno.env.get` + the throw-on-missing pattern from `_shared/supabase.ts`.

Relevant files:
- `/workspaces/huevos_donald/supabase/migrations/20260605174500_payments_mercadopago.sql` (payments columns, hold-first, comment already states the `round(cents/100)` rule)
- `/workspaces/huevos_donald/supabase/migrations/20260530183259_agent_ordering_schema.sql` (`orders`/`payments` base, `amount_cents bigint`, phone E.164 check)
- `/workspaces/huevos_donald/supabase/functions/_shared/supabase.ts` (env/secret + throw pattern to mirror)
- `/workspaces/huevos_donald/supabase/functions/_shared/cors.ts` (CORS helper for any client-facing pay endpoint)
- `/workspaces/huevos_donald/supabase/config.toml` (`verify_jwt = false` precedent for the webhook function)