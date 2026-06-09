# WhatsApp Cloud API (Meta WABA) — setup reference

How the `agent-whatsapp` edge function connects to Meta's WhatsApp Cloud API. The function is a
stateless webhook: Meta verifies it once over GET, then POSTs every inbound message; we run the
agent and reply via the Graph API. Docs: <https://developers.facebook.com/docs/whatsapp/cloud-api>.

## Credentials (Supabase Vault)

The WhatsApp credentials are **not** function env vars — they're stored encrypted in **Supabase
Vault** and read at runtime by the function through the locked-down `public.get_whatsapp_secrets()`
RPC (EXECUTE granted only to `service_role`; migration `20260607130000`). `_shared/vault.ts` calls
that RPC and caches the result per worker. `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` stay as
auto-injected env vars (they're needed to reach the DB/Vault); `WHATSAPP_GRAPH_VERSION` is an
optional env var (defaults `v23.0`).

| Vault secret | Required | What it is |
|---|---|---|
| `WHATSAPP_ACCESS_TOKEN` | ✅ | Bearer token used to send messages. **System User** (long-lived) token with the `whatsapp_business_messaging` permission — temporary tokens expire in 24h. |
| `WHATSAPP_PHONE_NUMBER_ID` | ✅ | The Cloud API **phone number ID** (NOT the phone number). Meta App → WhatsApp → API Setup. |
| `WHATSAPP_VERIFY_TOKEN` | ✅ | Arbitrary string we choose; Meta echoes it during GET verification. `openssl rand -hex 16`. |
| `WHATSAPP_APP_SECRET` | ✅ (prod) | Meta **App secret** (App → Settings → Basic). Verifies `X-Hub-Signature-256`. If absent, signature verification is **skipped with a warning** (dev only). |

Store or rotate them via SQL (MCP `execute_sql` or `supabase db query`) — never in a migration
file, which is committed:

```sql
-- upsert pattern (create or update)
select vault.create_secret('<value>', 'WHATSAPP_ACCESS_TOKEN', 'agent-whatsapp');
-- to rotate later:
-- select vault.update_secret((select id from vault.secrets where name='WHATSAPP_ACCESS_TOKEN'),
--                            '<new-value>', 'WHATSAPP_ACCESS_TOKEN', 'agent-whatsapp', null);
```

Verify (without printing values):
```sql
select name, description from vault.secrets where name like 'WHATSAPP\_%' order by name;
```

## One-time setup

1. **Meta app + WhatsApp product.** In the [Meta App dashboard](https://developers.facebook.com/apps),
   add the **WhatsApp** product. The test number + its `PHONE_NUMBER_ID` appear under *API Setup*.
2. **Long-lived token.** Create a System User in Meta Business Settings, assign the WhatsApp app +
   `whatsapp_business_messaging` permission, generate a non-expiring token, and store it in Vault as
   `WHATSAPP_ACCESS_TOKEN` (with the other three secrets — see *Credentials* above).
3. **Deploy** the function: `supabase functions deploy agent-whatsapp`.
4. **Register the webhook.** App dashboard → WhatsApp → *Configuration*:
   - **Callback URL:** `https://<project-ref>.functions.supabase.co/agent-whatsapp`
   - **Verify token:** the `WHATSAPP_VERIFY_TOKEN` value stored in Vault.
   - Meta sends a GET `?hub.mode=subscribe&hub.verify_token=…&hub.challenge=…`; the function echoes
     the challenge → the webhook turns green.
   - **Subscribe the `messages` field** (this is what delivers inbound texts; without it nothing arrives).

## Protocol (what the function implements)

- **GET verify** → echo `hub.challenge` (200) when `hub.mode=subscribe` and `hub.verify_token` matches.
- **POST inbound** → verify `X-Hub-Signature-256` (`sha256=` + HMAC-SHA256 of the **raw** body keyed
  by the Vault `WHATSAPP_APP_SECRET`) before parsing; then read
  `entry[].changes[].value.messages[]` where `from` is the sender phone (digits, no `+`, e.g.
  `56912345678`), `id` is the `wamid…` (dedup key), and `text.body` is the message. Delivery/read
  receipts arrive as `value.statuses[]` and are ignored. Always returns `200`.
- **Send** → `POST https://graph.facebook.com/<version>/<PHONE_NUMBER_ID>/messages` with
  `Authorization: Bearer <ACCESS_TOKEN>` and
  `{ messaging_product:"whatsapp", recipient_type:"individual", to, type:"text", text:{ body } }`.

## Interactive messages

`extractIncomingMessages` (was `…TextMessages`) also normalizes **taps**: a reply button arrives as
`type:"interactive"` with `interactive.button_reply.{id,title}`, a list pick as `interactive.list_reply.{id,title,description}`,
not as `type:"text"`. The `id` we set on the outbound element comes back verbatim; `context.id` is the
`wamid` of the message we sent. All three senders below reuse `postToGraph`, clamp every field on
send, are best-effort (never throw), and are only deliverable inside the 24h window (the agent always
replies, so that holds).

**Reply buttons** — `sendWhatsAppButtons(db, to, body, buttons, {footer})`: up to **3** buttons
(title ≤20, id ≤256, body ≤1024, footer ≤60). Used for **approvals**: the prompt is sent as
**Confirmar / Cancelar** buttons whose ids encode `appr:<approvalId>:yes|no`, so a tap resolves the
exact approval deterministically (see `approvalButtons` / `parseButtonDecision`). Typed `sí`/`no`
still works as a fallback (`parseDecision`).

**List pickers** — `sendWhatsAppList(db, to, body, button, sections, {footer,header})`: a tappable
list (**≤10 rows total** across sections; row title ≤24, description ≤72, id ≤200; list button ≤20).
The model calling `listPlans`/`listZones` IS the render signal — the webhook deterministically turns
those tool results into a list with row ids `plan:<plan_id>` / `zone:<zone_id>` (the WhatsApp system
prompt steers the model to stay brief and not enumerate options in prose). On tap, the row id flows
back as a synthetic user message carrying the UUID (`selectionToUserMessage`) so the model can route
it into `checkDeliveryAvailability` / `createOrder`. Empty catalog → no list is sent (no empty-sections
payload, which Graph rejects).

**CTA URL button** — `sendWhatsAppCtaUrl(db, to, body, buttonText, url, {footer,header})`: one
tappable link button (`action.name:"cta_url"`, `parameters:{display_text,url}`). Used after a
confirmed `createOrder` to surface the MercadoPago `payment_url` as a **Pagar ahora** button (body is
kept URL-free so the link isn't shown twice). A tap opens the URL and produces **no** inbound webhook —
payment confirmation arrives via the MercadoPago webhook, not here.

## Identity

WhatsApp **platform-verifies** the sender's number, so `agent-whatsapp` passes `from` as
`verifiedPhone` to `resolveCustomerIdentity` (see [`IDENTITY_MODEL.md`](./IDENTITY_MODEL.md)). A
match against `profiles.phone` / `subscriptions.contact_phone` yields a trusted `user_id`, which
unlocks the account tools (saldo, puntos, pausar/cancelar/reactivar, reclamo).

## 24-hour window

Free-form replies are only allowed within **24h** of the customer's last inbound message. The agent
only ever *replies* to inbound messages, so it stays inside the window. Re-engaging a cold chat
(>24h) would require a pre-approved **message template** — not implemented in this pass.

## Test locally

The function reads the WhatsApp creds from the **local** database's Vault, so seed it first (see the
`vault.create_secret(...)` snippet in `supabase/functions/.env.local`). If you skip `WHATSAPP_APP_SECRET`
locally, signature verification is skipped (dev), so unsigned curl tests still work.

```bash
supabase functions serve agent-whatsapp --no-verify-jwt --env-file ./supabase/functions/.env.local

# GET verification (echoes the challenge — token must match the local Vault value):
curl "http://localhost:54321/functions/v1/agent-whatsapp?hub.mode=subscribe&hub.verify_token=<verify-token>&hub.challenge=test123"

# POST a sample inbound text (with WHATSAPP_APP_SECRET absent from the local Vault, signature is skipped):
curl -X POST "http://localhost:54321/functions/v1/agent-whatsapp" \
  -H "Content-Type: application/json" \
  -d '{"object":"whatsapp_business_account","entry":[{"id":"WABA_ID","changes":[{"field":"messages","value":{"messaging_product":"whatsapp","metadata":{"phone_number_id":"PNID"},"contacts":[{"wa_id":"56912345678","profile":{"name":"Test"}}],"messages":[{"from":"56912345678","id":"wamid.TEST1","timestamp":"1700000000","type":"text","text":{"body":"hola, ¿qué planes tienen?"}}]}}]}]}'

# POST an approval BUTTON TAP (interactive.button_reply). The id must match a live
# pending approval: "appr:<approvalId>:yes" confirms, ":no" cancels. Substitute the
# approvalId saved in agent_pending_approvals for the conversation.
curl -X POST "http://localhost:54321/functions/v1/agent-whatsapp" \
  -H "Content-Type: application/json" \
  -d '{"object":"whatsapp_business_account","entry":[{"id":"WABA_ID","changes":[{"field":"messages","value":{"messaging_product":"whatsapp","metadata":{"phone_number_id":"PNID"},"contacts":[{"wa_id":"56912345678","profile":{"name":"Test"}}],"messages":[{"from":"56912345678","id":"wamid.TAP1","timestamp":"1700000001","type":"interactive","context":{"id":"wamid.OUTBOUND"},"interactive":{"type":"button_reply","button_reply":{"id":"appr:<approvalId>:yes","title":"✅ Confirmar"}}}]}}]}]}'

# POST a LIST PICK (interactive.list_reply). The id is what we set on the row:
# "plan:<plan_id>" / "zone:<zone_id>" — re-enters as a synthetic user message
# carrying the UUID. Substitute a real plans.id / delivery_zones.id.
curl -X POST "http://localhost:54321/functions/v1/agent-whatsapp" \
  -H "Content-Type: application/json" \
  -d '{"object":"whatsapp_business_account","entry":[{"id":"WABA_ID","changes":[{"field":"messages","value":{"messaging_product":"whatsapp","metadata":{"phone_number_id":"PNID"},"contacts":[{"wa_id":"56912345678","profile":{"name":"Test"}}],"messages":[{"from":"56912345678","id":"wamid.TAP2","timestamp":"1700000002","type":"interactive","interactive":{"type":"list_reply","list_reply":{"id":"plan:<plan_id>","title":"Plan Familiar","description":"12 huevos · $3.990 semanal"}}}]}}]}]}'
```
