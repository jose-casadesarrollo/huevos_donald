-- Replace the Telegram channel with WhatsApp as the agent's messaging channel.
-- The payments/subscriptions `source` CHECK constraints allowed 'telegram' but
-- not 'whatsapp'; flip them. Additive + idempotent, and we migrate any existing
-- 'telegram' rows to 'whatsapp' first so the tightened CHECK never fails.
--
-- agent_conversations rows with channel='telegram' are intentionally NOT
-- rewritten: their external_id is a Telegram chat id, which would violate the
-- existing `channel <> 'whatsapp' OR external_id ~ '^56[0-9]{8,9}$'` CHECK.

-- 1) Migrate legacy source values.
update public.payments      set source = 'whatsapp' where source = 'telegram';
update public.subscriptions set source = 'whatsapp' where source = 'telegram';
update public.orders        set source = 'whatsapp' where source = 'telegram';

-- 2) Re-point the source CHECK constraints: drop 'telegram', allow 'whatsapp'.
alter table public.payments drop constraint if exists payments_source_chk;
alter table public.payments add constraint payments_source_chk
  check (source in ('web','whatsapp','agent','system'));

alter table public.subscriptions drop constraint if exists subscriptions_source_chk;
alter table public.subscriptions add constraint subscriptions_source_chk
  check (source in ('web','whatsapp','agent','system'));

-- 3) New conversations default to the WhatsApp channel (we still pass it
--    explicitly from the edge function; this just keeps the schema honest).
alter table public.agent_conversations alter column channel set default 'whatsapp';
