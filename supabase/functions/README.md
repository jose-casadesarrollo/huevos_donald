# Huevos Donald — AI ordering agent (Supabase Edge Functions)

The ordering/support agent lives **server-side in Edge Functions** (Deno), not in
the Next.js app. Two entrypoints share one agent core:

| Function | Purpose | Auth |
|---|---|---|
| `agent-whatsapp` | WhatsApp (Meta WABA Cloud API) webhook. Non-streaming `generateText`, durable tool-approval round-trip via `agent_pending_approvals`. The platform-verified sender phone authenticates the customer (account tools unlock). | GET `hub.challenge` verify + POST `X-Hub-Signature-256` HMAC (`verify_jwt = false`) |
| `agent-chat` | Browser chat endpoint, `useChat`-compatible streaming (`streamText` → `toUIMessageStreamResponse`). | CORS allow-list (`verify_jwt = false`) |

Built with the **Vercel AI SDK v5** (`ai@5` + `@ai-sdk/openai@2`) — see
[`AI_SDK_V5_EDGE_REFERENCE.md`](./AI_SDK_V5_EDGE_REFERENCE.md) for the exact API
notes this code targets.

## Layout

```
_shared/
  agent.ts          OpenAI model + Spanish (Chile) system prompt
  tools.ts          AI SDK tools: listPlans, listZones, checkDeliveryAvailability, createOrder (needsApproval)
  catalog.ts        read-only catalog + availability + CLP pricing (from real `plans` rows)
  conversations.ts  conversation lifecycle + message persistence (ModelMessage[] for WhatsApp, UIMessage[] for web)
  approvals.ts      durable pending-approval state for the stateless WhatsApp resume
  identity.ts       channel-aware trusted identity (web JWT / verified WhatsApp phone)
  whatsapp.ts       Meta WABA Cloud API helpers: verify, signature, parse, send
  vault.ts          loads WhatsApp creds from Supabase Vault (get_whatsapp_secrets RPC)
  supabase.ts       service-role client (bypasses RLS; only writer to orders/agent_*)
  cors.ts           CORS for the web endpoint
  database.types.ts generated types (copy of src/lib/supabase/database.types.ts)
agent-whatsapp/     index.ts + deno.json
agent-chat/         index.ts + deno.json
```

## How the agent works

- Tools read the live catalog so the model **never invents** prices, zones, cupos or dates.
- A one-time order is created from a real plan (`plan_id` → quantity + price), phone
  normalized to Chile `^56XXXXXXXXX`, availability re-checked at commit time.
- `createOrder` has `needsApproval: true`. In v5 the model call does **not** pause —
  it returns a `tool-approval-request`. The customer confirms (WhatsApp: reply *sí/no*;
  web: `useChat` approval UI) and the order is only then committed.

## Secrets

Set as Supabase function secrets (NOT Next.js env):

```bash
supabase secrets set \
  OPENAI_API_KEY=sk-... \
  AGENT_CHAT_ALLOWED_ORIGINS="https://huevosdonald.cl,http://localhost:3000"
# Optional: OPENAI_MODEL (defaults to gpt-4o-mini), WHATSAPP_GRAPH_VERSION (defaults to v23.0)
```

The **WhatsApp credentials are stored in Supabase Vault**, not as env vars — `agent-whatsapp`
reads them via the locked-down `get_whatsapp_secrets()` RPC (see `_shared/vault.ts` and
[`WHATSAPP_REFERENCE.md`](./WHATSAPP_REFERENCE.md)). `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`
are injected automatically.

## Deploy

```bash
supabase functions deploy agent-whatsapp
supabase functions deploy agent-chat
```

## Register the WhatsApp webhook

In the Meta App dashboard → WhatsApp → Configuration, set the callback URL to the deployed
function, the verify token to `WHATSAPP_VERIFY_TOKEN`, and **subscribe the `messages` field**.
Meta sends a GET `hub.challenge` to verify; the function echoes it. Callback URL:

```
https://<project-ref>.functions.supabase.co/agent-whatsapp
```

## Call the web endpoint (frontend)

```ts
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";

const { messages, sendMessage } = useChat({
  transport: new DefaultChatTransport({
    api: "https://<project-ref>.functions.supabase.co/agent-chat",
    body: { chatId }, // stable id to persist the conversation across turns
  }),
});
```

## Local dev

```bash
supabase functions serve            # uses [edge_runtime] policy=per_worker for waitUntil
# then POST a sample WhatsApp webhook payload or chat body to the local URL
```
