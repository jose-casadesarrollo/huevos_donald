# Agent customer-identity model

Account-scoped agent tools (`checkSaldo`, `checkPuntos`, `pauseSubscription`,
`cancelSubscription`, `reactivateSubscription`, `reportDamagedProduct`) act on a
specific customer's data, all keyed by `auth.users` / `profiles.id` (`user_id`).
The chat itself is not inherently authenticated, so we resolve a **trusted**
`user_id` per channel before letting those tools run.

Resolution lives in [`_shared/identity.ts`](./_shared/identity.ts)
(`resolveCustomerIdentity`) and the result is threaded into `ToolContext.userId`.

## Trust per channel

| Channel | Signal | Trusted? | How |
|---|---|---|---|
| **web** | Supabase session JWT | ✅ | Widget forwards the logged-in user's access token as the `x-customer-jwt` header; `agent-chat` validates it with `db.auth.getUser(jwt)` → `user_id`. |
| **whatsapp** | sender's phone number | ✅ | WhatsApp **platform-verifies** the sender, so a `phone → profiles.phone / subscriptions.contact_phone` match is trustworthy. `agent-whatsapp` passes the sender `from` as `verifiedPhone`. |
| **typed phone** | anything the user types in chat | ❌ | Never trusted — a typed number proves nothing. Only a platform-`verifiedPhone` counts. |

## Behavior when unidentified
- `ToolContext.userId` is `null`.
- Account tools return a friendly "inicia sesión en tu cuenta" message and take no action.
- `buildSystemPrompt({ authenticated })` tells the model whether a session exists, so it
  steers the customer to the website instead of attempting account tools.
- `getOrderStatus` is the one exception: it can report the status of the order created
  **in the current conversation** (`orders.conversation_id`) without any identity.

## WhatsApp wiring
The `agent-whatsapp` edge function (channel `"whatsapp"`) passes the **provider-verified**
sender number as `verifiedPhone` to `resolveCustomerIdentity`, which maps it to `user_id` via the
`whatsapp_number` branch. A resolved `user_id` is written back to `agent_conversations.user_id`
and threaded into `ToolContext.userId`, so account tools work without a separate login step.
