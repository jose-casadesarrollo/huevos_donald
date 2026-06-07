-- Allow guest (agent/web) subscriptions + MercadoPago preapproval wiring,
-- mirroring the orders guest model. Additive + idempotent.

-- Guests (Telegram/web without an auth account) can subscribe with an email.
alter table public.subscriptions alter column user_id drop not null;

alter table public.subscriptions add column if not exists contact_email text;
alter table public.subscriptions add column if not exists contact_phone text;
alter table public.subscriptions add column if not exists source text not null default 'web';
alter table public.subscriptions add column if not exists conversation_id uuid;
alter table public.subscriptions add column if not exists external_reference uuid not null default gen_random_uuid();

do $$ begin
  alter table public.subscriptions add constraint subscriptions_conversation_id_fkey
    foreign key (conversation_id) references public.agent_conversations(id) on delete set null;
exception when duplicate_object then null; end $$;
do $$ begin
  alter table public.subscriptions add constraint subscriptions_source_chk
    check (source in ('web','telegram','agent','system'));
exception when duplicate_object then null; end $$;
do $$ begin
  alter table public.subscriptions add constraint subscriptions_phone_chk
    check (contact_phone is null or contact_phone ~ '^56[0-9]{8,9}$');
exception when duplicate_object then null; end $$;

create unique index if not exists uq_subscriptions_external_reference
  on public.subscriptions(external_reference);
create index if not exists idx_subscriptions_mp_id
  on public.subscriptions(mercadopago_subscription_id);
