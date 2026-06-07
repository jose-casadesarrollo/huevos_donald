-- Per-message feedback (thumbs up / down) for the AI assistant answers shown in
-- the web support chat widget.
--
-- Keyed by the browser's stable chat_id (= agent_conversations.external_id for
-- channel 'web') and the assistant message id (msg_… from the agent-chat
-- UI-message stream). The web channel REPLACES all agent_messages rows each turn
-- (see _shared/conversations.ts), so feedback cannot live on the message row — it
-- gets its own append-only table; the latest row per (chat_id, message_id) wins.
--
-- Anonymous visitors leave feedback, so RLS allows INSERT for anon/authenticated
-- but grants NO select/update/delete — analytics reads go through the service
-- role (Edge functions), which bypasses RLS.

create table if not exists public.agent_message_feedback (
  id          uuid primary key default gen_random_uuid(),
  chat_id     text not null,
  message_id  text not null,
  rating      text not null check (rating in ('up', 'down')),
  created_at  timestamptz not null default now()
);

create index if not exists agent_message_feedback_chat_message_idx
  on public.agent_message_feedback (chat_id, message_id, created_at desc);

alter table public.agent_message_feedback enable row level security;

-- Newly created tables aren't auto-exposed via the REST API: grant INSERT only.
-- No SELECT/UPDATE/DELETE grant => visitors can append a rating but never read or
-- alter feedback rows.
grant insert on public.agent_message_feedback to anon, authenticated;

drop policy if exists "submit message feedback" on public.agent_message_feedback;
create policy "submit message feedback"
  on public.agent_message_feedback
  for insert
  to anon, authenticated
  with check (rating in ('up', 'down'));
