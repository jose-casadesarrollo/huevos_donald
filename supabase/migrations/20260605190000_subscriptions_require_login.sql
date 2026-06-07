-- Product decision: recurring SUBSCRIPTIONS require a logged-in user (web only).
-- One-time egg orders stay guest-friendly (the Telegram/chat agent sells those),
-- but subscriptions must be tied to an auth user. This reverses the user_id
-- relaxation from 20260605182000_subscriptions_guest_mp.sql.
--
-- The guest contact/source/external_reference columns added there are kept: a
-- logged-in web subscription still records contact_email/phone, source='web',
-- and the MP external_reference join key. conversation_id stays nullable/unused
-- (the agent no longer creates subscriptions).

-- Safe: subscriptions table is currently empty (0 rows).
alter table public.subscriptions
  alter column user_id set not null;
