// MercadoPago client (Chile / CLP) — raw REST, no Node SDK.
// Verified against the MP API (see MERCADOPAGO_REFERENCE.md). Money is the #1
// risk: our DB stores amount_cents (pesos*100); MP wants INTEGER CLP pesos.
// Auth/env mirrors _shared/supabase.ts (Deno.env, throw-on-missing).

const MP = "https://api.mercadopago.com";

function mpToken(): string {
  const t = Deno.env.get("MP_ACCESS_TOKEN");
  if (!t) throw new Error("Missing MP_ACCESS_TOKEN in the edge function environment.");
  return t; // APP_USR-… in prod, TEST-… in sandbox; the token decides the env
}

export function mpPublicKey(): string {
  const k = Deno.env.get("MP_PUBLIC_KEY");
  if (!k) throw new Error("Missing MP_PUBLIC_KEY in the edge function environment.");
  return k;
}

function mpHeaders(extra: Record<string, string> = {}): Record<string, string> {
  return {
    Authorization: `Bearer ${mpToken()}`,
    "Content-Type": "application/json",
    ...extra,
  };
}

export class MpApiError extends Error {
  constructor(public status: number, public body: string) {
    super(`MercadoPago API ${status}: ${body}`);
    this.name = "MpApiError";
  }
}

// ── THE MONEY RULE ────────────────────────────────────────────────────────────
/** amount_cents (pesos*100) -> integer CLP pesos. 499000 -> 4990. */
export function clpFromCents(amountCents: number): number {
  if (!Number.isInteger(amountCents) || amountCents < 0) {
    throw new Error(`bad amount_cents: ${amountCents}`);
  }
  const clp = Math.round(amountCents / 100);
  if (clp < 1) throw new Error(`CLP amount underflow from ${amountCents}`);
  return clp;
}

/** MP transaction_amount (integer CLP, sometimes a string) -> amount_cents. */
export function centsFromMpAmount(amount: unknown): number {
  return Math.round(Number(amount) * 100);
}

async function mpFetch(path: string, init: RequestInit): Promise<unknown> {
  const res = await fetch(`${MP}${path}`, init);
  const text = await res.text();
  if (!res.ok) throw new MpApiError(res.status, text);
  return text ? JSON.parse(text) : {};
}

// ── Checkout Pro: one-time order pay link ─────────────────────────────────────
export interface CreatePreferenceInput {
  amountCents: number;
  title: string;
  quantity: number;
  externalReference: string; // payments.external_reference (uuid)
  notificationUrl: string; // public https, NO localhost
  successUrl: string;
  pendingUrl: string;
  failureUrl: string;
  payerEmail?: string;
  metadata?: Record<string, unknown>;
  expiresAt?: string; // ISO-8601
}

export interface PreferenceResult {
  id: string;
  init_point: string;
  sandbox_init_point: string;
}

export async function createPreference(
  input: CreatePreferenceInput,
): Promise<PreferenceResult> {
  const unit_price = clpFromCents(input.amountCents); // integer CLP guard
  const body: Record<string, unknown> = {
    items: [{
      id: input.externalReference,
      title: input.title,
      quantity: input.quantity,
      currency_id: "CLP",
      unit_price,
    }],
    external_reference: input.externalReference,
    notification_url: input.notificationUrl,
    back_urls: {
      success: input.successUrl,
      pending: input.pendingUrl,
      failure: input.failureUrl,
    },
    auto_return: "approved", // requires back_urls.success
    // Chile: Webpay / bank transfer are async (pending). binary_mode:true would
    // auto-reject those, hurting approval rate. Keep false; settle via webhook.
    binary_mode: false,
    metadata: { external_reference: input.externalReference, ...input.metadata },
  };
  if (input.payerEmail) body.payer = { email: input.payerEmail };
  if (input.expiresAt) {
    body.expires = true;
    body.expiration_date_to = input.expiresAt;
  }
  // Stable idempotency key per order so retries don't mint duplicate preferences.
  return (await mpFetch("/checkout/preferences", {
    method: "POST",
    headers: mpHeaders({ "X-Idempotency-Key": input.externalReference }),
    body: JSON.stringify(body),
  })) as PreferenceResult;
}

// ── Payments: authoritative reads + card charge ───────────────────────────────
export interface MpPayment {
  id: number;
  status: string;
  status_detail?: string;
  external_reference?: string;
  transaction_amount?: number | string;
  currency_id?: string;
  date_approved?: string | null;
  payment_method_id?: string;
  payer?: { email?: string };
  [k: string]: unknown;
}

/** Authoritative status read. id = MP's numeric payment id (NOT external_reference). */
export async function getPayment(id: string | number): Promise<MpPayment> {
  return (await mpFetch(`/v1/payments/${id}`, { headers: mpHeaders() })) as MpPayment;
}

/** Search payments by our external_reference (0/1/many — a retry yields several). */
export async function searchPaymentsByExternalRef(
  externalReference: string,
): Promise<MpPayment[]> {
  const u = new URL(`${MP}/v1/payments/search`);
  u.searchParams.set("external_reference", externalReference);
  u.searchParams.set("sort", "date_created");
  u.searchParams.set("criteria", "desc");
  u.searchParams.set("limit", "10");
  const res = await fetch(u, { headers: mpHeaders() });
  const text = await res.text();
  if (!res.ok) throw new MpApiError(res.status, text);
  const json = JSON.parse(text) as { results?: MpPayment[] };
  return json.results ?? [];
}

export interface CreateCardPaymentInput {
  amountCents: number;
  cardToken: string; // single-use, client-minted with the public key
  paymentMethodId: string;
  installments: number;
  payerEmail: string;
  externalReference: string;
  idempotencyKey: string; // persist once per attempt; reuse on retry
  notificationUrl: string;
  description?: string;
}

export async function createCardPayment(
  input: CreateCardPaymentInput,
): Promise<MpPayment> {
  const body = {
    transaction_amount: clpFromCents(input.amountCents),
    token: input.cardToken,
    description: input.description ?? "Pedido Huevos Donald",
    installments: input.installments,
    payment_method_id: input.paymentMethodId,
    external_reference: input.externalReference,
    notification_url: input.notificationUrl,
    binary_mode: false,
    payer: { email: input.payerEmail },
  };
  return (await mpFetch("/v1/payments", {
    method: "POST",
    headers: mpHeaders({ "X-Idempotency-Key": input.idempotencyKey }),
    body: JSON.stringify(body),
  })) as MpPayment;
}

// ── Webhook signature (fail-closed) ───────────────────────────────────────────
function parseXSignature(h: string | null): { ts: string; v1: string } | null {
  if (!h) return null;
  let ts = "", v1 = "";
  for (const part of h.split(",")) {
    const idx = part.indexOf("=");
    if (idx === -1) continue;
    const key = part.slice(0, idx).trim();
    const val = part.slice(idx + 1).trim();
    if (key === "ts") ts = val;
    else if (key === "v1") v1 = val;
  }
  return ts && v1 ? { ts, v1 } : null;
}

function timingSafeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/**
 * Verify MercadoPago's x-signature. FAIL CLOSED: returns false if the secret or
 * headers are missing, the signature is malformed, the HMAC mismatches, or the
 * timestamp is stale (>5 min). Manifest is position/punctuation-sensitive:
 *   id:<data.id from URL, lowercased if alphanumeric>;request-id:<x-request-id>;ts:<ts>;
 * (request-id segment omitted entirely when absent). Does NOT consume the body.
 */
export async function verifyWebhookSignature(req: Request): Promise<boolean> {
  const secret = Deno.env.get("MP_WEBHOOK_SECRET");
  if (!secret) {
    console.error("verifyWebhookSignature: MP_WEBHOOK_SECRET missing — refusing webhook");
    return false;
  }
  const sig = parseXSignature(req.headers.get("x-signature"));
  const requestId = req.headers.get("x-request-id");
  let dataId = new URL(req.url).searchParams.get("data.id");
  if (!sig || !dataId) return false;
  if (/[a-z]/i.test(dataId)) dataId = dataId.toLowerCase();

  const ageSec = Math.abs(Date.now() / 1000 - Number(sig.ts));
  if (!Number.isFinite(ageSec) || ageSec > 300) return false;

  const manifest = requestId
    ? `id:${dataId};request-id:${requestId};ts:${sig.ts};`
    : `id:${dataId};ts:${sig.ts};`;

  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const buf = await crypto.subtle.sign("HMAC", key, enc.encode(manifest));
  const hex = [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
  return timingSafeEqualHex(hex, sig.v1);
}

/** Parse the notification topic + resource id from body and/or URL. */
export function parseNotification(
  body: { type?: string; action?: string; data?: { id?: string } } | null,
  url: string,
): { type: string | null; dataId: string | null } {
  const q = new URL(url).searchParams;
  const type = body?.type ?? body?.action?.split(".")[0] ?? q.get("type");
  const dataId = body?.data?.id ?? q.get("data.id") ?? q.get("id");
  return { type: type ?? null, dataId: dataId ?? null };
}

/** MP payment.status -> our payment_status enum. */
export function mapPaymentStatus(
  mpStatus: string,
): "pending" | "approved" | "rejected" | "refunded" | "charged_back" | "cancelled" {
  switch (mpStatus) {
    case "approved":
      return "approved";
    case "refunded":
      return "refunded";
    case "charged_back":
      return "charged_back";
    case "cancelled":
      return "cancelled";
    case "rejected":
      return "rejected";
    // pending / in_process / authorized / in_mediation -> still waiting
    default:
      return "pending";
  }
}

// ── Suscripciones (recurring) via preapproval ─────────────────────────────────
export interface CreatePreapprovalPlanInput {
  reason: string;
  amountCents: number;
  backUrl: string;
  frequency?: number;
  frequencyType?: "months" | "days";
}

export async function createPreapprovalPlan(
  input: CreatePreapprovalPlanInput,
): Promise<{ id: string; [k: string]: unknown }> {
  const body = {
    reason: input.reason,
    auto_recurring: {
      frequency: input.frequency ?? 1,
      frequency_type: input.frequencyType ?? "months",
      transaction_amount: clpFromCents(input.amountCents),
      currency_id: "CLP",
    },
    back_url: input.backUrl,
  };
  return (await mpFetch("/preapproval_plan", {
    method: "POST",
    headers: mpHeaders(),
    body: JSON.stringify(body),
  })) as { id: string };
}

export interface CreateSubscriptionInput {
  reason: string;
  amountCents: number;
  payerEmail: string;
  externalReference: string;
  backUrl: string;
  frequency?: number;
  frequencyType?: "months" | "days";
  planId?: string;
  /** Provide a client-minted token to auto-charge (status authorized); omit for redirect flow. */
  cardTokenId?: string;
}

export interface PreapprovalResult {
  id: string;
  status: string;
  init_point?: string;
  sandbox_init_point?: string;
  [k: string]: unknown;
}

/**
 * Create a subscription (preapproval). Without cardTokenId -> redirect flow
 * (status 'pending', use init_point). With cardTokenId -> auto-charge (status
 * 'authorized'). No idempotency header exists here: dedup on external_reference.
 */
export async function createSubscription(
  input: CreateSubscriptionInput,
): Promise<PreapprovalResult> {
  const body: Record<string, unknown> = {
    reason: input.reason,
    external_reference: input.externalReference,
    payer_email: input.payerEmail,
    auto_recurring: {
      frequency: input.frequency ?? 1,
      frequency_type: input.frequencyType ?? "months",
      transaction_amount: clpFromCents(input.amountCents),
      currency_id: "CLP",
    },
    back_url: input.backUrl,
    status: input.cardTokenId ? "authorized" : "pending",
  };
  if (input.planId) body.preapproval_plan_id = input.planId;
  if (input.cardTokenId) body.card_token_id = input.cardTokenId;
  return (await mpFetch("/preapproval", {
    method: "POST",
    headers: mpHeaders(),
    body: JSON.stringify(body),
  })) as PreapprovalResult;
}

export async function getPreapproval(id: string): Promise<PreapprovalResult> {
  return (await mpFetch(`/preapproval/${id}`, { headers: mpHeaders() })) as PreapprovalResult;
}

export async function updatePreapproval(
  id: string,
  patch: { status?: "paused" | "cancelled" | "authorized"; cardTokenId?: string },
): Promise<PreapprovalResult> {
  const body: Record<string, unknown> = {};
  if (patch.status) body.status = patch.status;
  if (patch.cardTokenId) body.card_token_id = patch.cardTokenId;
  return (await mpFetch(`/preapproval/${id}`, {
    method: "PUT",
    headers: mpHeaders(),
    body: JSON.stringify(body),
  })) as PreapprovalResult;
}

/** MP preapproval.status -> our subscription_status enum. */
export function mapSubscriptionStatus(
  mpStatus: string,
): "pending" | "authorized" | "paused" | "cancelled" | "past_due" {
  switch (mpStatus) {
    case "authorized":
      return "authorized";
    case "paused":
      return "paused";
    case "cancelled":
      return "cancelled";
    default:
      return "pending";
  }
}
