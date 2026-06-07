// Meta WhatsApp Cloud API (WABA) helpers for the agent webhook.
//
// Three responsibilities:
//   1. GET webhook verification (hub.challenge handshake).
//   2. POST authenticity check (X-Hub-Signature-256 HMAC over the raw body).
//   3. Parse inbound text messages + send replies via the Graph API.
//
// Credentials come from Supabase Vault (see _shared/vault.ts), so every function
// that touches them takes the service-role `db` client.
//
// Docs: https://developers.facebook.com/docs/whatsapp/cloud-api
import type { Db } from "./supabase.ts";
import { getWhatsAppConfig } from "./vault.ts";

const GRAPH = "https://graph.facebook.com";

// ── Inbound payload shapes (only the fields we read) ─────────────────────────
export interface WhatsAppMessage {
  from: string; // sender phone, digits only (e.g. "56912345678")
  id: string; // "wamid…" — used for idempotency
  timestamp?: string;
  type: string; // "text" | "image" | "interactive" | …
  text?: { body: string };
}

export interface WhatsAppValue {
  messaging_product?: string;
  metadata?: { phone_number_id?: string; display_phone_number?: string };
  contacts?: Array<{ wa_id: string; profile?: { name?: string } }>;
  messages?: WhatsAppMessage[];
  /** Delivery/read receipts arrive here (no `messages`); we ignore them. */
  statuses?: unknown[];
}

export interface WhatsAppWebhook {
  object?: string;
  entry?: Array<{
    id?: string;
    changes?: Array<{ field?: string; value?: WhatsAppValue }>;
  }>;
}

export interface IncomingText {
  from: string;
  id: string;
  text: string;
  profileName?: string;
}

/**
 * GET handshake. When you register the callback URL, Meta calls it with
 * hub.mode/hub.verify_token/hub.challenge. Echo the challenge iff the token
 * matches the Vault `WHATSAPP_VERIFY_TOKEN`. Returns a Response for GET
 * requests, or null so the caller falls through to POST handling.
 */
export async function handleVerificationRequest(
  db: Db,
  req: Request,
): Promise<Response | null> {
  if (req.method !== "GET") return null;
  const url = new URL(req.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge") ?? "";
  const { verifyToken } = await getWhatsAppConfig(db);
  if (mode === "subscribe" && verifyToken && token === verifyToken) {
    return new Response(challenge, { status: 200 });
  }
  return new Response("Forbidden", { status: 403 });
}

/** Constant-time string compare (equal-length hex digests). */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/**
 * Verify the `X-Hub-Signature-256` header: "sha256=" + HMAC-SHA256(rawBody)
 * keyed by the Vault `WHATSAPP_APP_SECRET`. MUST run on the raw request body,
 * before JSON parse. Fail-closed when the app secret is present; skipped (with a
 * warning) when it's absent, so local dev works without it.
 */
export async function verifyWhatsAppSignature(
  db: Db,
  rawBody: string,
  signatureHeader: string | null,
): Promise<boolean> {
  const { appSecret } = await getWhatsAppConfig(db);
  if (!appSecret) {
    console.warn("WHATSAPP_APP_SECRET not in Vault — skipping signature verification (dev only).");
    return true;
  }
  if (!signatureHeader) return false;

  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(appSecret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(rawBody));
  const hex = [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, "0")).join("");
  return timingSafeEqual(`sha256=${hex}`, signatureHeader.trim());
}

/**
 * Flatten the webhook into the inbound text messages we act on. Non-text
 * messages and status-only (delivery/read) payloads yield nothing.
 */
export function extractIncomingTextMessages(payload: WhatsAppWebhook): IncomingText[] {
  const out: IncomingText[] = [];
  for (const entry of payload.entry ?? []) {
    for (const change of entry.changes ?? []) {
      const value = change.value;
      if (!value?.messages) continue;
      for (const msg of value.messages) {
        const body = msg.text?.body?.trim();
        if (msg.type !== "text" || !body || !msg.from || !msg.id) continue;
        const profileName = value.contacts?.find((c) => c.wa_id === msg.from)?.profile?.name ??
          value.contacts?.[0]?.profile?.name;
        out.push({ from: msg.from, id: msg.id, text: body, profileName });
      }
    }
  }
  return out;
}

/**
 * Send a plain-text WhatsApp message. Best-effort: logs non-2xx responses but
 * never throws, so a send failure can't abort settlement/webhook handling.
 * Credentials (token, phone-number-id, graph version) come from Vault.
 */
export async function sendWhatsAppMessage(db: Db, to: string, text: string): Promise<void> {
  const { accessToken, phoneNumberId, graphVersion } = await getWhatsAppConfig(db);
  if (!accessToken || !phoneNumberId) {
    console.error(
      "sendWhatsAppMessage: missing WHATSAPP_ACCESS_TOKEN / WHATSAPP_PHONE_NUMBER_ID in Vault.",
    );
    return;
  }
  const url = `${GRAPH}/${graphVersion}/${phoneNumberId}/messages`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to,
      type: "text",
      text: { body: text, preview_url: false },
    }),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    console.error(`sendWhatsAppMessage failed (${res.status}): ${detail}`);
  }
}
