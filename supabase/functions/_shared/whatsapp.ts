// Meta WhatsApp Cloud API (WABA) helpers for the agent webhook.
//
// Three responsibilities:
//   1. GET webhook verification (hub.challenge handshake).
//   2. POST authenticity check (X-Hub-Signature-256 HMAC over the raw body).
//   3. Parse inbound text + interactive replies, and send text / button replies
//      via the Graph API.
//
// Interactive: when a user TAPS a reply button or list row, the inbound is NOT
// `type:"text"` — it arrives as `type:"interactive"` with `button_reply`/
// `list_reply` (the `id` we set comes back verbatim; `context.id` is the wamid of
// the message we sent). We normalize those into IncomingMessage so the webhook
// can act on the tap.
//
// Credentials come from Supabase Vault (see _shared/vault.ts), so every function
// that touches them takes the service-role `db` client.
//
// Docs: https://developers.facebook.com/docs/whatsapp/cloud-api
import type { Db } from "./supabase.ts";
import { getWhatsAppConfig } from "./vault.ts";

const GRAPH = "https://graph.facebook.com";

// WABA hard limits (Meta docs, rev 2026-05-21). We clamp defensively on send so a
// long agent line or summary can never make the Graph API reject the message.
const MAX_BUTTONS = 3;
const MAX_BUTTON_TITLE = 20;
const MAX_BUTTON_ID = 256;
const MAX_BODY = 1024;
const MAX_FOOTER = 60;
const MAX_HEADER = 60;
// Interactive LIST limits (Meta docs). Note row.id caps at 200, not 256.
const MAX_LIST_BUTTON = 20; // action.button label
const MAX_SECTION_TITLE = 24; // section.title
const MAX_ROW_TITLE = 24; // row.title
const MAX_ROW_DESC = 72; // row.description
const MAX_ROW_ID = 200; // row.id
const MAX_LIST_ROWS = 10; // total rows across all sections (hard cap)

// ── Inbound payload shapes (only the fields we read) ─────────────────────────
export interface WhatsAppMessage {
  from: string; // sender phone, digits only (e.g. "56912345678")
  id: string; // "wamid…" — used for idempotency
  timestamp?: string;
  type: string; // "text" | "interactive" | "image" | …
  text?: { body: string };
  /** Present when the user tapped a reply button or picked a list row. */
  interactive?: {
    type?: string; // "button_reply" | "list_reply"
    button_reply?: { id: string; title: string };
    list_reply?: { id: string; title: string; description?: string };
  };
  /** Present when the message is a reply/quote: `id` = wamid of the quoted msg. */
  context?: { id?: string; from?: string };
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

export interface IncomingMessage {
  from: string;
  id: string;
  /** Text to feed the model / display. For a tap, this is the button/row title. */
  text: string;
  profileName?: string;
  /** Set when the inbound is a tap on one of our interactive messages. */
  interactive?: {
    kind: "button_reply" | "list_reply";
    /** The id WE set on the outbound element, echoed back verbatim. */
    id: string;
    title: string;
  };
  /**
   * `context.id` = wamid of the message we sent that this replies to. Captured for
   * future correlation/forensics (e.g. matching a tap to the exact outbound
   * message); not yet consumed — approval taps already self-identify via the id.
   */
  contextId?: string;
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
 * Flatten the webhook into the inbound messages we act on: free text plus taps on
 * reply buttons / list rows (normalized into `interactive`). Status-only
 * (delivery/read) payloads and unsupported types (media, location, …) yield nothing.
 */
export function extractIncomingMessages(payload: WhatsAppWebhook): IncomingMessage[] {
  const out: IncomingMessage[] = [];
  for (const entry of payload.entry ?? []) {
    for (const change of entry.changes ?? []) {
      const value = change.value;
      if (!value?.messages) continue;
      for (const msg of value.messages) {
        if (!msg.from || !msg.id) continue;

        let text = "";
        let interactive: IncomingMessage["interactive"];

        if (msg.type === "text") {
          text = msg.text?.body?.trim() ?? "";
        } else if (msg.type === "interactive") {
          const it = msg.interactive;
          if (it?.type === "button_reply" && it.button_reply) {
            interactive = {
              kind: "button_reply",
              id: it.button_reply.id,
              title: it.button_reply.title,
            };
            text = it.button_reply.title?.trim() ?? "";
          } else if (it?.type === "list_reply" && it.list_reply) {
            interactive = {
              kind: "list_reply",
              id: it.list_reply.id,
              title: it.list_reply.title,
            };
            text = it.list_reply.title?.trim() ?? "";
          }
        }

        // Skip anything we can't act on (no text and not an interactive tap).
        if (!text && !interactive) continue;

        const profileName = value.contacts?.find((c) => c.wa_id === msg.from)?.profile?.name ??
          value.contacts?.[0]?.profile?.name;
        out.push({
          from: msg.from,
          id: msg.id,
          text,
          profileName,
          interactive,
          contextId: msg.context?.id,
        });
      }
    }
  }
  return out;
}

/**
 * POST a message payload to the Graph API. Best-effort: logs non-2xx responses
 * but never throws, so a send failure can't abort settlement/webhook handling.
 * Wraps the payload in the shared `messaging_product` / `recipient_type` envelope.
 * Credentials (token, phone-number-id, graph version) come from Vault.
 */
async function postToGraph(db: Db, payload: Record<string, unknown>): Promise<void> {
  const { accessToken, phoneNumberId, graphVersion } = await getWhatsAppConfig(db);
  if (!accessToken || !phoneNumberId) {
    console.error(
      "postToGraph: missing WHATSAPP_ACCESS_TOKEN / WHATSAPP_PHONE_NUMBER_ID in Vault.",
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
      ...payload,
    }),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    console.error(`postToGraph failed (${res.status}): ${detail}`);
  }
}

/** Send a plain-text WhatsApp message. */
export async function sendWhatsAppMessage(db: Db, to: string, text: string): Promise<void> {
  await postToGraph(db, {
    to,
    type: "text",
    text: { body: text, preview_url: false },
  });
}

export interface ReplyButton {
  /** Echoed back verbatim as `button_reply.id` on tap (≤256 chars). */
  id: string;
  /** Visible label (≤20 chars). */
  title: string;
}

/**
 * Send an interactive message with up to 3 reply buttons. On tap, the inbound
 * webhook carries `interactive.button_reply.id` = the `id` set here — so encode
 * whatever you need to correlate the decision into that id. Fields are clamped to
 * WABA limits; deliverable only inside the 24h window (the agent always replies,
 * so that holds). Only the first 3 buttons are sent.
 */
export async function sendWhatsAppButtons(
  db: Db,
  to: string,
  body: string,
  buttons: ReplyButton[],
  opts?: { footer?: string },
): Promise<void> {
  const interactive: Record<string, unknown> = {
    type: "button",
    body: { text: body.slice(0, MAX_BODY) },
    action: {
      buttons: buttons.slice(0, MAX_BUTTONS).map((b) => ({
        type: "reply",
        reply: { id: b.id.slice(0, MAX_BUTTON_ID), title: b.title.slice(0, MAX_BUTTON_TITLE) },
      })),
    },
  };
  if (opts?.footer) interactive.footer = { text: opts.footer.slice(0, MAX_FOOTER) };
  await postToGraph(db, { to, type: "interactive", interactive });
}

export interface ListRow {
  /** Echoed back verbatim as `list_reply.id` on tap (≤200 chars). */
  id: string;
  /** Visible label (≤24 chars). */
  title: string;
  /** Optional secondary line (≤72 chars). */
  description?: string;
}

export interface ListSection {
  title: string; // ≤24
  rows: ListRow[];
}

/**
 * Send an interactive LIST message. On tap, the inbound webhook carries
 * `interactive.list_reply.id` = the row `id` set here — so encode whatever you
 * need to correlate the choice into that id. Total rows across all sections are
 * clamped to 10 (WABA hard cap; overflow truncates rather than being rejected).
 * Deliverable only inside the 24h window (the agent always replies, so that holds).
 */
export async function sendWhatsAppList(
  db: Db,
  to: string,
  body: string,
  button: string,
  sections: ListSection[],
  opts?: { footer?: string; header?: string },
): Promise<void> {
  // Enforce the GLOBAL 10-row cap across sections (slice cumulatively).
  let budget = MAX_LIST_ROWS;
  const clampedSections = sections
    .map((s) => {
      const rows = s.rows.slice(0, Math.max(0, budget)).map((r) => ({
        id: r.id.slice(0, MAX_ROW_ID),
        title: r.title.slice(0, MAX_ROW_TITLE),
        ...(r.description ? { description: r.description.slice(0, MAX_ROW_DESC) } : {}),
      }));
      budget -= rows.length;
      return { title: s.title.slice(0, MAX_SECTION_TITLE), rows };
    })
    .filter((s) => s.rows.length > 0);

  // Never emit an empty-sections list — Graph rejects it (400). Callers should
  // also gate on row count, but guard here so this helper can't send invalid JSON.
  if (clampedSections.length === 0) return;

  const interactive: Record<string, unknown> = {
    type: "list",
    body: { text: body.slice(0, MAX_BODY) },
    action: { button: button.slice(0, MAX_LIST_BUTTON), sections: clampedSections },
  };
  if (opts?.header) interactive.header = { type: "text", text: opts.header.slice(0, MAX_HEADER) };
  if (opts?.footer) interactive.footer = { text: opts.footer.slice(0, MAX_FOOTER) };
  await postToGraph(db, { to, type: "interactive", interactive });
}

/**
 * Send an interactive CTA URL button (a single tappable link button). Used for
 * the MercadoPago pay link. `action.name` MUST be the literal "cta_url". A tap
 * opens the URL and produces NO inbound webhook (payment confirmation arrives via
 * the MercadoPago webhook, not here).
 */
export async function sendWhatsAppCtaUrl(
  db: Db,
  to: string,
  body: string,
  buttonText: string,
  url: string,
  opts?: { footer?: string; header?: string },
): Promise<void> {
  const interactive: Record<string, unknown> = {
    type: "cta_url",
    body: { text: body.slice(0, MAX_BODY) },
    action: {
      name: "cta_url",
      parameters: { display_text: buttonText.slice(0, MAX_BUTTON_TITLE), url },
    },
  };
  if (opts?.header) interactive.header = { type: "text", text: opts.header.slice(0, MAX_HEADER) };
  if (opts?.footer) interactive.footer = { text: opts.footer.slice(0, MAX_FOOTER) };
  await postToGraph(db, { to, type: "interactive", interactive });
}
