# Vercel AI SDK v5 — Build-Ready Reference (Supabase Edge / Deno + OpenAI)

Scope: implementing an AI ordering/support agent inside a Supabase Edge Function (Deno runtime, `npm:` specifiers), OpenAI provider, message persistence to Postgres (jsonb `parts`), and human-in-the-loop (HITL) tool approval backed by a pending-approvals table.

Version pin (critical): AI SDK **v5** = `ai@5` + `@ai-sdk/openai@2` + `@ai-sdk/provider@2`. The npm `latest` dist-tag for `@ai-sdk/openai` is the **v6** line (3.x) and `ai` also has a 6.x — do **not** install `latest`. Always pin the major in the import specifier.

---

## 1. Packages & imports for Deno / Supabase Edge

Use `npm:` specifiers with pinned majors. Server-side code uses only **core** primitives from `ai` (the React `@ai-sdk/react` package is client-only and must not be imported in the Edge Function).

```ts
// Pinned npm: specifiers (recommended in source for clarity)
import {
  generateText,
  streamText,
  convertToModelMessages,
  tool,
  stepCountIs,
  hasToolCall,
  generateId,
  createIdGenerator,
  validateUIMessages,
  type UIMessage,
  type ModelMessage,
  type ToolApprovalResponse,
} from 'npm:ai@5';
import { openai, createOpenAI } from 'npm:@ai-sdk/openai@2';
import { z } from 'npm:zod@3';
```

Alternatively, declare a per-function import map so source can use bare specifiers. Per-function `deno.json` is the recommended (deployment-isolated) approach; a global one is for local dev only. `deno.json` supersedes the legacy `import_map.json` (and wins if both exist).

```jsonc
// supabase/functions/<fn>/deno.json
{
  "imports": {
    "ai": "npm:ai@5",
    "@ai-sdk/openai": "npm:@ai-sdk/openai@2",
    "zod": "npm:zod@3"
  }
}
```

Optional, for Deno/Supabase global types (`EdgeRuntime`, etc.):

```ts
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
```

zod peer range for `@ai-sdk/openai@2`: `^3.25.76 || ^4.1.8`. Pin a zod that satisfies this (older 3.x may not).

Caveats:
- Bare `'ai'` imports only work with a `deno.json` import map.
- Old tutorials using `esm.sh/ai@3.x` are AI SDK **v3** — do not copy.
- If a transitive dep needs Node built-ins, import them via the `node:` prefix (e.g. `import process from 'node:process'`). Prefer `Deno.env.get` over `process.env` for secrets.

---

## 2. OpenAI provider setup

```ts
import { openai, createOpenAI } from 'npm:@ai-sdk/openai@2';

// Default instance auto-reads OPENAI_API_KEY from the environment.
// In Deno, process.env is NOT populated the usual way — prefer createOpenAI.
const openaiProvider = createOpenAI({
  apiKey: Deno.env.get('OPENAI_API_KEY')!, // set via: supabase secrets set OPENAI_API_KEY=...
  // baseURL?: 'https://api.openai.com/v1'  (default)
  // organization?, project?, headers?, fetch? (custom impl)
});

const model = openaiProvider('gpt-4o-mini'); // Responses API (default in v5)
```

API-surface selection:

```ts
openai('gpt-4o-mini')            // === openai.responses(...)  — Responses API is the DEFAULT in v5
openai.responses('gpt-4o-mini')  // explicit Responses API
openai.chat('gpt-4o-mini')       // Chat Completions API (v4's old default)
openai.completion('gpt-3.5-turbo-instruct') // legacy completions
openai.embedding('text-embedding-3-large')  // embeddings
```

Provider options are passed per call under `providerOptions.openai`. Keys differ between the Responses and Chat surfaces:
- Responses: `parallelToolCalls`, `store`, `user`, `reasoningEffort`, `reasoningSummary` (`'auto'|'detailed'`), `strictJsonSchema`, `serviceTier`, `textVerbosity`, `metadata`, `maxToolCalls`, `truncation`, `promptCacheKey`, `systemMessageMode`, …
- Chat: `reasoningEffort` (`'minimal'|'low'|'medium'|'high'|'xhigh'`), `maxCompletionTokens`, `logitBias`, `logprobs`, `parallelToolCalls`, `store`, `strictJsonSchema`, …

```ts
const result = await generateText({
  model: openaiProvider('gpt-4o-mini'),
  prompt: '…',
  providerOptions: { openai: { parallelToolCalls: false, strictJsonSchema: true, user: 'user_123' } },
});
```

Notes / uncertainty:
- Model id availability depends on the provider package version. The notes list `gpt-5.x` ids for the newest provider, but the safe v5-era set is `gpt-4o`, `gpt-4o-mini`, `gpt-4.1`, `gpt-4.1-mini`, `o1`, `o3`, `o3-mini`, `o4-mini`. For cost-sensitive edge usage `gpt-4o-mini` is the common choice. **Confirm the exact id against your installed `@ai-sdk/openai@2` version** rather than assuming `gpt-5.x` is present.
- `providerMetadata.openai` shape depends on the surface: Responses → `{ responseId, logprobs, serviceTier }`; Chat reasoning → `{ reasoningTokens, cachedPromptTokens }`.
- Built-in OpenAI tools (`openai.tools.webSearch`, `fileSearch`, `codeInterpreter`, `mcp`, …) are only available via the Responses surface.

---

## 3. `generateText` vs `streamText` + the agentic loop

```ts
// generateText IS awaited — returns a Promise.
const { text, steps, totalUsage, response } = await generateText({ model, prompt });

// streamText is NOT awaited — returns a result object synchronously and starts streaming.
const result = streamText({ model, prompt });
for await (const delta of result.textStream) { /* … */ }
```

Multi-step / agentic looping (the order-taking loop): controlled by `stopWhen`, **not** `maxSteps` (removed in v5). Default loop cap is `stepCountIs(20)`.

```ts
import { generateText, stepCountIs, hasToolCall } from 'npm:ai@5';

const result = await generateText({
  model,
  system: 'You take egg orders and answer support questions…',
  messages,
  tools,
  stopWhen: stepCountIs(10),                 // single condition
  // stopWhen: [stepCountIs(20), hasToolCall('placeOrder')], // ARRAY = OR semantics: stop when ANY matches
});
```

Per-step control and observation:

```ts
await generateText({
  model, tools, messages,
  prepareStep: async ({ model, stepNumber, steps, messages }) => {
    // return a PARTIAL settings object; {} keeps defaults
    if (stepNumber === 0) return { activeTools: ['searchMenu'], toolChoice: 'required' };
    return {}; // model/system/messages/toolChoice/activeTools all overridable
  },
  onStepFinish: async ({ stepNumber, finishReason, usage, toolCalls }) => {
    // stepNumber is zero-based; usage has inputTokens / outputTokens
  },
  onFinish: ({ text, finishReason, usage, totalUsage, response, steps }) => {
    // usage = FINAL step only; totalUsage = aggregated across all steps
    // response.messages available for persistence
  },
});
```

Streaming-specific: you **must** supply `onError` — `streamText` suppresses streaming errors (they will not surface as a rejected promise). `result.textStream` is both a `ReadableStream` and an `AsyncIterable`; `result.fullStream` is an `AsyncIterable` of typed parts (`switch` on `part.type`: `text-start`/`text-delta`/`text-end`, `tool-call`, `tool-result`, `tool-error`, `finish`, …).

HTTP response helpers (return standard Web `Response`, Edge-compatible):
- `result.toUIMessageStreamResponse(opts?)` — for `useChat` clients (and our persistence hook).
- `result.toTextStreamResponse()` — raw `text/plain` stream.
- `result.consumeStream()` — drains the stream server-side (used with `EdgeRuntime.waitUntil` so `onFinish` runs even if the client disconnects).

Do **not** use `pipeUIMessageStreamToResponse` / `pipeTextStreamToResponse` in Deno/Edge — they expect a Node `ServerResponse`. Use the `to*Response()` variants.

Optional `ToolLoopAgent` abstraction (encapsulates model + tools + loop). The current v5 docs name it `ToolLoopAgent` (older betas used `Agent`/`Experimental_Agent` — verify your installed exports). Its system prompt option is `instructions` (not `system`):

```ts
import { ToolLoopAgent, stepCountIs } from 'npm:ai@5';
const agent = new ToolLoopAgent({ model, instructions: '…', tools, stopWhen: stepCountIs(50) });
const { text, steps } = await agent.generate({ prompt });
```

For our edge function the plain `generateText`/`streamText` core functions are recommended (explicit control, simpler HITL handling).

---

## 4. Defining tools — `tool()` + zod `inputSchema` + `execute`

```ts
import { tool } from 'npm:ai@5';
import { z } from 'npm:zod@3';

const searchMenu = tool({
  description: 'Search the egg menu by query',
  inputSchema: z.object({                         // v5: inputSchema (NOT v4 `parameters`)
    query: z.string().describe('What the customer is looking for'),
  }),
  execute: async ({ query }, { toolCallId, messages, abortSignal }) => {
    // second arg = ToolExecutionOptions: { toolCallId, messages, abortSignal?, experimental_context? }
    const res = await fetch(`/menu?q=${query}`, { signal: abortSignal });
    return await res.json(); // value | Promise | AsyncIterable (last yielded value is final)
  },
});
```

Key points:
- `description` optional, `inputSchema` required, `execute` **optional**. Omit `execute` for client-side / HITL / termination-signal tools — you then supply results manually or the loop stops.
- `toolChoice`: `'auto'` (default) | `'required'` | `'none'` | `{ type: 'tool', toolName }`.
- `activeTools` restricts which defined tools the model may call (subset of names).
- Errors during multi-step do **not** throw by default — tool failures appear as `tool-error` content parts in `steps[].content` (filter `part.type === 'tool-error'`, has `.toolName`, `.error`). Top-level errors (`NoSuchToolError`, `InvalidToolInputError` [renamed from v4 `InvalidToolArgumentsError`], `ToolCallRepairError`) are catchable via try/catch with `.isInstance(error)`.
- Pass per-call context via `experimental_context` on `generateText/streamText`, read it in `execute` options (experimental).
- `onInputStart` / `onInputDelta` / `onInputAvailable` fire only with `streamText`.

Uncertainty: the notes flag `isLoopFinished`, `experimental_onToolCallStart/Finish`, and `inputExamples` as **unverified / possibly hallucinated** — do not rely on them without checking installed exports. `InferToolOutput` was not separately confirmed (output type infers from `execute` return / `outputSchema`).

---

## 5. Message persistence — UIMessage/parts, `convertToModelMessages`, `toUIMessageStreamResponse` + `onFinish`

The persisted jsonb shape is **`UIMessage[]`** (not the v4 `{role, content}` shape).

```ts
interface UIMessage<METADATA = unknown, DATA_PARTS = UIDataTypes, TOOLS = UITools> {
  id: string;
  role: 'system' | 'user' | 'assistant';
  metadata?: METADATA;
  parts: Array<UIMessagePart>;          // semantic content lives here, NOT a `content` string
}
```

Part types (discriminated on `type`):
- `{ type: 'text'; text: string; state?: 'streaming'|'done' }`
- `{ type: 'reasoning'; text; state?; providerMetadata? }`
- `{ type: 'file'; mediaType; filename?; url }`
- `{ type: 'source-url' | 'source-document'; … }`
- `{ type: 'step-start' }`
- `tool-${NAME}` (ToolUIPart): `{ toolCallId, input, state: 'input-streaming'|'input-available'|'output-available'|'output-error', output?/errorText? }` — plus the HITL states in §6.
- `data-${NAME}` (DataUIPart): `{ id?, data }`

Conversion + persistence flow. Pass `originalMessages` so client-generated ids are preserved and the streamed assistant response is merged back; then `onFinish.messages` is the complete, correctly-ID'd history to save.

```ts
import { convertToModelMessages, streamText, type UIMessage } from 'npm:ai@5';

const { messages, chatId } = await req.json() as { messages: UIMessage[]; chatId: string };

const result = streamText({
  model: openaiProvider('gpt-4o-mini'),
  system: '…',
  messages: await convertToModelMessages(messages), // await it — may return a promise
  tools,
  stopWhen: stepCountIs(10),
  onError: ({ error }) => console.error(error),
});

return result.toUIMessageStreamResponse({
  originalMessages: messages,                          // preserves ids + merges response
  generateMessageId: createIdGenerator({ prefix: 'msg', size: 16 }), // stable server-side ids
  onFinish: ({ messages }) => { await saveChat({ chatId, messages }); }, // { messages, responseMessage }
  // messageMetadata, sendReasoning, sendSources, onError also available
});
```

Persisting to Postgres jsonb: store the whole array as JSON.

```ts
// pseudo: jsonb column `parts` holds the UIMessage[] (or one column per message storing its parts)
await db.from('chats').upsert({ id: chatId, messages /* JSON.stringify by the driver */ });
```

Send-only-last-message pattern (lower payload): the **client** sends only the newest message + id; the **server** loads history, appends, validates, converts:

```ts
const { message, id } = await req.json();
const previous = await loadChat(id);                 // from DB
const validated = await validateUIMessages({         // re-validates vs current tools/schemas; throws TypeValidationError
  messages: [...previous, message], tools,
});
const result = streamText({ messages: await convertToModelMessages(validated), tools });
return result.toUIMessageStreamResponse({
  originalMessages: validated,
  onFinish: ({ messages }) => saveChat({ chatId: id, messages }),
});
```

Client-disconnect safety (important on Edge): the stream can abort before `onFinish` runs, skipping your DB write. Force completion:

```ts
result.consumeStream();                  // no await
// OR, to keep the worker alive for background persistence:
EdgeRuntime.waitUntil(result.consumeStream());
return result.toUIMessageStreamResponse({ originalMessages: messages, onFinish: … });
```

Notes:
- `onFinish` shape differs by API: `toUIMessageStreamResponse` → `({ messages, responseMessage })` (use `messages`); `createUIMessageStream` → `({ responseMessage })`.
- `validateUIMessages` is useful for long-lived chats whose tool schemas drifted — wrap in try/catch to migrate/filter or fall back to `[]`.
- Use distinct id prefixes for origin (`'msg'` server vs `'msgc'` client).

---

## 6. Human-in-the-loop tool approval

Core mechanism: `needsApproval` on `tool()`. **`generateText`/`streamText` do NOT pause** — they complete and return a `tool-approval-request` part. You collect the approval, then make a **second** model call to execute (or report denial). This statelessness is exactly why a pending-approvals DB table fits an Edge Function.

```ts
const placeOrder = tool({
  description: 'Place a confirmed egg order',
  inputSchema: z.object({ items: z.array(z.string()), total: z.number() }),
  needsApproval: true,                                  // boolean…
  // …or a predicate: needsApproval: async ({ amount }) => amount > 1000
  execute: async ({ items, total }) => { /* charge / write order */ return { ok: true }; },
});
```

Two distinct vocabularies (do not conflate):
- **Core/server** (`result.content`): part `{ type: 'tool-approval-request'; approvalId; toolCall }`; response `ToolApprovalResponse = { type: 'tool-approval-response'; approvalId; approved; reason? }`.
- **UI** (`useChat`, client only): tool-part `state` `'approval-requested'|'approval-responded'`; id at `part.approval.id`; terminal states `'output-available'` (approved+executed) / `'output-denied'` (denied). Client calls `addToolApprovalResponse({ id, approved })`, and to auto-continue set `useChat({ sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithApprovalResponses })` (imported from `'ai'`).

Server-side core round-trip (the Edge path):

```ts
import { generateText, type ModelMessage, type ToolApprovalResponse } from 'npm:ai@5';

// --- First call: collect approval requests ---
const messages: ModelMessage[] = [{ role: 'user', content: 'Order 2 dozen eggs' }];
const r1 = await generateText({ model, tools: { placeOrder }, messages });
messages.push(...r1.response.messages);              // REQUIRED: carry forward the assistant turn w/ the request

const pending: { approvalId: string; toolCall: unknown }[] = [];
for (const part of r1.content) {
  if (part.type === 'tool-approval-request') {
    pending.push({ approvalId: part.approvalId, toolCall: part.toolCall });
    // PERSIST: store serialized `messages` + approvalId(s)/toolCallId(s) in agent_pending_approvals,
    // then return — the human approves out-of-band (Telegram button / admin UI).
  }
}

// --- Second call (after approval webhook): rehydrate `messages`, append responses, resume ---
const approvals: ToolApprovalResponse[] = pending.map(p => ({
  type: 'tool-approval-response',
  approvalId: p.approvalId,
  approved: true,                                     // false to deny
  reason: 'User confirmed via Telegram',             // optional context for the model
}));
messages.push({ role: 'tool', content: approvals }); // tool-role message carries the responses
const r2 = await generateText({ model, tools: { placeOrder }, messages }); // executes if approved
```

Persistence across requests (not covered by docs — synthesized): the SDK is stateless across requests. To use `agent_pending_approvals`:
1. On the first call, persist the serialized `messages` (including `r1.response.messages` with the `tool-approval-request`) plus the `approvalId`(s)/`toolCallId`(s). `ToolApprovalResponse` and `ModelMessage` are plain JSON-serializable objects.
2. On the approval webhook, rehydrate `messages`, push `{ role: 'tool', content: [ToolApprovalResponse] }`, re-call `generateText`, persist the result, mark the approval row resolved.

Denial UX: a denied tool ends in UI state `'output-denied'`. Add a system instruction so the model does not retry:

```ts
system: 'When a tool execution is not approved by the user, do not retry it. ' +
        'Inform the user that the action was not performed.',
```

Notes:
- Approval is its own loop stop reason (the agent loop terminates on "a tool call needs approval"), **orthogonal** to `stopWhen`/`stepCountIs`.
- Forgetting `messages.push(...r1.response.messages)` breaks the linkage between request and response.
- `needsApproval` predicate arg shape: the reference shows `({ args }) => …`; the dynamic example destructures the input directly (`async ({ amount }) => amount > 1000`). Both appear in the docs — treat as the input object.

---

## 7. Minimal `Deno.serve` edge-function skeletons

### 7a. Streaming web endpoint (for a browser `useChat` client) with persistence + HITL tools

```ts
// supabase/functions/chat/index.ts
import {
  streamText,
  convertToModelMessages,
  createIdGenerator,
  stepCountIs,
  tool,
  type UIMessage,
} from 'npm:ai@5';
import { createOpenAI } from 'npm:@ai-sdk/openai@2';
import { z } from 'npm:zod@3';

const openai = createOpenAI({ apiKey: Deno.env.get('OPENAI_API_KEY')! });

const tools = {
  searchMenu: tool({
    description: 'Search the egg menu',
    inputSchema: z.object({ query: z.string() }),
    execute: async ({ query }, { abortSignal }) => {
      // … query Supabase; honor abortSignal in fetch
      return { results: [] };
    },
  }),
  placeOrder: tool({
    description: 'Place a confirmed order',
    inputSchema: z.object({ items: z.array(z.string()), total: z.number() }),
    needsApproval: async ({ total }) => total > 50, // gate large orders
    execute: async ({ items, total }) => ({ ok: true }),
  }),
};

Deno.serve(async (req) => {
  const { messages, chatId } = (await req.json()) as { messages: UIMessage[]; chatId: string };

  const result = streamText({
    model: openai('gpt-4o-mini'),
    system: 'You are the Huevos Donald ordering assistant. Be concise.',
    messages: await convertToModelMessages(messages),
    tools,
    stopWhen: stepCountIs(10),
    onError: ({ error }) => console.error('stream error', error),
  });

  // Ensure persistence runs even if the client disconnects mid-stream.
  EdgeRuntime.waitUntil(result.consumeStream());

  return result.toUIMessageStreamResponse({
    originalMessages: messages,
    generateMessageId: createIdGenerator({ prefix: 'msg', size: 16 }),
    onFinish: async ({ messages }) => {
      // Persist UIMessage[] to the jsonb column.
      // await supabase.from('chats').upsert({ id: chatId, messages });
    },
  });
});
```

### 7b. Non-streaming `generateText` path (Telegram webhook), with HITL persisted to `agent_pending_approvals`

```ts
// supabase/functions/telegram/index.ts
import {
  generateText,
  stepCountIs,
  tool,
  type ModelMessage,
  type ToolApprovalResponse,
} from 'npm:ai@5';
import { createOpenAI } from 'npm:@ai-sdk/openai@2';
import { z } from 'npm:zod@3';

const openai = createOpenAI({ apiKey: Deno.env.get('OPENAI_API_KEY')! });

const tools = {
  placeOrder: tool({
    description: 'Place a confirmed order',
    inputSchema: z.object({ items: z.array(z.string()), total: z.number() }),
    needsApproval: async ({ total }) => total > 50,
    execute: async ({ items, total }) => ({ ok: true }),
  }),
};

Deno.serve(async (req) => {
  const update = await req.json(); // Telegram update payload
  const chatId = String(update.message.chat.id);
  const userText = update.message.text as string;

  // Rehydrate prior conversation from DB (ModelMessage[] or UIMessage[] -> convert).
  const messages: ModelMessage[] = await loadModelMessages(chatId);
  messages.push({ role: 'user', content: userText });

  const result = await generateText({
    model: openai('gpt-4o-mini'),
    system:
      'You are the Huevos Donald ordering assistant. ' +
      'When a tool execution is not approved, do not retry it; tell the user it was not performed.',
    tools,
    messages,
    stopWhen: stepCountIs(8),
  });

  // Carry forward the assistant turn (REQUIRED for the approval round-trip).
  messages.push(...result.response.messages);

  // Did the model request approval for any tool?
  const approvalRequests = result.content.filter(
    (p): p is Extract<typeof p, { type: 'tool-approval-request' }> =>
      p.type === 'tool-approval-request',
  );

  if (approvalRequests.length > 0) {
    // Persist pending approval + serialized messages; ask the human via Telegram.
    for (const ar of approvalRequests) {
      await savePendingApproval({
        chatId,
        approvalId: ar.approvalId,
        toolCall: ar.toolCall,
        messages, // JSON-serializable ModelMessage[]
      });
      await sendTelegram(chatId, `Confirm this action? Reply /approve_${ar.approvalId} or /deny_${ar.approvalId}`);
    }
    await persistModelMessages(chatId, messages);
    return new Response('ok'); // 200 to Telegram; resume happens on the approval callback
  }

  // No approval needed — reply with the final text and persist.
  await persistModelMessages(chatId, messages);
  await sendTelegram(chatId, result.text);
  return new Response('ok');
});

// --- Approval callback (separate route or branch): resume after human decides ---
export async function resumeAfterApproval(approvalId: string, approved: boolean) {
  const { chatId, messages } = await loadPendingApproval(approvalId); // ModelMessage[]
  const approvals: ToolApprovalResponse[] = [
    { type: 'tool-approval-response', approvalId, approved, reason: 'Human decision' },
  ];
  messages.push({ role: 'tool', content: approvals });

  const r2 = await generateText({ model: openai('gpt-4o-mini'), tools, messages, stopWhen: stepCountIs(8) });
  messages.push(...r2.response.messages);
  await persistModelMessages(chatId, messages);
  await markApprovalResolved(approvalId);
  await sendTelegram(chatId, r2.text);
}
```

For the Telegram path you can persist either `ModelMessage[]` (what `generateText` consumes/produces directly) or `UIMessage[]` (uniform jsonb shape with the web client). If you want a single shared jsonb format, store `UIMessage[]` and `convertToModelMessages` on load — but note the core HITL round-trip operates on `ModelMessage[]`, so converting back and forth around an unresolved approval is **untested in the docs**; the simplest robust approach is to store the raw `ModelMessage[]` (including `response.messages`) for in-flight approvals.

---

## 8. Gotchas

### v4 → v5 changes
- `tool({ parameters })` → `tool({ inputSchema })`.
- `maxTokens` → `maxOutputTokens`.
- `maxSteps: n` → `stopWhen: stepCountIs(n)` (import `stepCountIs` from `'ai'`). `maxSteps` is gone. Default loop = `stepCountIs(20)`.
- `temperature` is **no longer defaulted to 0** — set `temperature: 0` explicitly if you want near-deterministic output.
- `openai(modelId)` now hits the **Responses API** (was Chat Completions in v4). Use `openai.chat(modelId)` for Chat. Behavior, `providerMetadata` shape, and supported provider options differ.
- Structured-output config moved from a model factory arg (`openai('…', { structuredOutputs: true })`) to `providerOptions.openai.strictJsonSchema`; strict JSON schema is **on by default** — disable with `strictJsonSchema: false`.
- `toDataStreamResponse()` → `toUIMessageStreamResponse()`.
- `CoreMessage` → `ModelMessage`; `Message` → `UIMessage`; `convertToCoreMessages()` → `convertToModelMessages()`.
- UIMessage `content` (string) is **gone** → use `message.parts`. Render text via `m.parts.filter(p => p.type==='text').map(p => p.text).join('')`.
- `useChat` moved to `@ai-sdk/react`; it no longer owns `input`/`handleInputChange`/`handleSubmit`; use `sendMessage({ text })` and `regenerate`. `api` is configured via `transport: new DefaultChatTransport({ api })`. `initialMessages` → `messages`. `sendExtraMessageFields` removed.
- Stream/result field renames: tool-call `args` → `input`; tool-result `result` → `output`. Text streaming is 3-phase (`text-start`/`text-delta`/`text-end`); `toolCallStreaming` param removed (always on).
- Error type `InvalidToolArgumentsError` → `InvalidToolInputError`. `experimental_toToolResultContent` → `toModelOutput` (new shape `{ type:'content', value:[…] }`; image parts use `{ type:'media', mediaType, data }`).
- `providerMetadata` (as input) → `providerOptions`; `mimeType` → `mediaType`.
- New result fields: `totalUsage` (across steps) vs `usage` (final step), `rawFinishReason`, `reasoning`/`reasoningText`, `sources`, `files`, `content`, `output`. Token usage uses `inputTokens`/`outputTokens` (not v4 `promptTokens`/`completionTokens`).
- Agent class is `ToolLoopAgent` (older betas: `Agent`/`Experimental_Agent` — verify installed exports). Its system prompt option is `instructions`.

### Edge / Deno caveats
- Import via `npm:ai@5` / `npm:@ai-sdk/openai@2`, or a per-function `deno.json` import map. Pin majors. Do not use `esm.sh@3.x` tutorials or the `latest` (v6) dist-tag.
- The default `openai` instance reads `process.env.OPENAI_API_KEY`, which is not populated normally in Deno — use `createOpenAI({ apiKey: Deno.env.get('OPENAI_API_KEY')! })`. Set with `supabase secrets set OPENAI_API_KEY=…`.
- Return streaming via `toUIMessageStreamResponse()` / `toTextStreamResponse()` / `new Response(result.textStream)` (Web Streams are first-class in Deno). Do **not** use `pipe*ToResponse()` (Node `ServerResponse` only).
- `streamText` suppresses streaming errors — always provide `onError`.
- Client disconnects can skip `onFinish` (your DB write). Call `result.consumeStream()` (no await) before returning, or wrap it in `EdgeRuntime.waitUntil(...)` so persistence completes after the response.
- Local CLI testing terminates instances after each request, so `waitUntil` background work may not finish — set `policy = "per_worker"` in `supabase/config.toml` to test locally.
- Node built-ins via `node:` prefix only; avoid global `process.env` for secrets.
- `ai-sdk.dev` has no `/docs/getting-started/deno` page; Deno specifics come from Supabase's functions docs (dependencies, background-tasks, ai-models).

### Conflicts / uncertainty flagged in the source notes
- Model ids: notes list `gpt-5.x` from the newest provider, but the v5 (`@ai-sdk/openai@2`) line may not include them. Confirm against your installed version; `gpt-4o-mini`/`gpt-4o`/`gpt-4.1`/`o3`/`o4-mini` are safe.
- Unverified / possibly hallucinated symbols: `isLoopFinished`, `experimental_onToolCallStart`, `experimental_onToolCallFinish`, `inputExamples`. `InferToolOutput` not separately confirmed.
- `ToolLoopAgent` name is current-docs; betas differed. Verify exports.
- `needsApproval` predicate arg: reference shows `({ args })`, dynamic example destructures input directly — both in docs.
- `reasoningEffort` enum differs by surface (Chat: `'minimal'|'low'|'medium'|'high'|'xhigh'`; Responses example shows `'low'|'medium'|'high'`).
- HITL persistence across requests and storing in-flight approvals as `UIMessage[]` vs `ModelMessage[]` is **not documented** — the round-trip code above is synthesized; the docs only show the in-process two-call core loop and the in-process `useChat` UI flow. Prefer storing raw `ModelMessage[]` for unresolved approvals.