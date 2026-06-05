-- Agent + one-time ordering schema (additive, idempotent).
-- Supports the AI Telegram/WhatsApp support+ordering agent. Mirrors existing conventions:
-- public.tg_set_updated_at() trigger, public.is_admin() RLS, _cents money, gen_random_uuid().

-- 1) Enums (guarded: CREATE TYPE has no IF NOT EXISTS)
do $$ begin
  create type public.order_status as enum
    ('pending','awaiting_payment','paid','fulfilling','completed','cancelled','refunded');
exception when duplicate_object then null; end $$;
do $$ begin
  create type public.agent_conversation_status as enum ('open','awaiting_approval','closed');
exception when duplicate_object then null; end $$;
do $$ begin
  create type public.approval_status as enum ('pending','approved','denied','expired');
exception when duplicate_object then null; end $$;

-- 2) orders: one-time (ad-hoc) orders taken by the agent. Commercial record; a deliveries row
--    will reference it for fulfillment in a later phase.
create table if not exists public.orders (
  id                      uuid primary key default gen_random_uuid(),
  user_id                 uuid,                         -- nullable: WhatsApp/Telegram guests have no auth profile
  contact_phone           text not null,
  contact_name            text,
  quantity                integer not null check (quantity > 0),
  amount_cents            bigint  not null check (amount_cents >= 0),
  currency                text    not null default 'CLP',
  status                  public.order_status not null default 'pending',
  source                  text    not null default 'agent',
  plan_id                 uuid,                         -- optional link to a catalog plan
  delivery_zone_id        uuid,
  preferred_slot_id       uuid,
  requested_delivery_date date,
  delivery_address        text,
  delivery_notes          text,
  mercadopago_payment_id  text,
  conversation_id         uuid,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now(),
  constraint orders_phone_e164_chk check (contact_phone ~ '^56[0-9]{8,9}$')
);

-- 3) agent_conversations: one per (channel, external_id). external_id = telegram chat id / wa phone.
create table if not exists public.agent_conversations (
  id               uuid primary key default gen_random_uuid(),
  channel          text not null default 'telegram',
  external_id      text not null,
  user_id          uuid,
  order_id         uuid,
  status           public.agent_conversation_status not null default 'open',
  last_inbound_at  timestamptz,
  last_outbound_at timestamptz,
  metadata         jsonb not null default '{}'::jsonb,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  constraint agent_conversations_channel_external_uk unique (channel, external_id),
  constraint agent_conversations_wa_e164_chk
    check (channel <> 'whatsapp' or external_id ~ '^56[0-9]{8,9}$')
);

-- 4) agent_messages: persisted UIMessage history (one row per message).
create table if not exists public.agent_messages (
  id                  uuid primary key default gen_random_uuid(),
  conversation_id     uuid not null,
  role                text not null check (role in ('user','assistant','system','tool')),
  parts               jsonb not null default '[]'::jsonb,
  content_text        text,
  provider_message_id text,
  prompt_tokens       integer,
  completion_tokens   integer,
  total_tokens        integer,
  created_at          timestamptz not null default now()
);

-- 5) agent_pending_approvals: durable state for the SDK tool-approval pause/resume across messages.
create table if not exists public.agent_pending_approvals (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null,
  approval_id     text not null,
  tool_name       text not null,
  tool_input      jsonb not null default '{}'::jsonb,
  summary         text,
  status          public.approval_status not null default 'pending',
  created_at      timestamptz not null default now(),
  resolved_at     timestamptz,
  constraint agent_pending_approvals_conv_approval_uk unique (conversation_id, approval_id)
);

-- 6) processed_webhook_events: idempotency for at-least-once webhook delivery.
create table if not exists public.processed_webhook_events (
  id           uuid primary key default gen_random_uuid(),
  provider     text not null,
  event_id     text not null,
  processed_at timestamptz not null default now(),
  constraint processed_webhook_events_provider_event_uk unique (provider, event_id)
);

-- 7) payments.order_id (tie one-time charges to an order; keep subscription_id for subscription charges)
alter table public.payments add column if not exists order_id uuid;

-- 8) Foreign keys (added after all tables exist; guarded so re-run is safe)
do $$ begin alter table public.orders add constraint orders_user_id_fkey
  foreign key (user_id) references public.profiles(id) on delete set null;
exception when duplicate_object then null; end $$;
do $$ begin alter table public.orders add constraint orders_plan_id_fkey
  foreign key (plan_id) references public.plans(id) on delete set null;
exception when duplicate_object then null; end $$;
do $$ begin alter table public.orders add constraint orders_delivery_zone_id_fkey
  foreign key (delivery_zone_id) references public.delivery_zones(id) on delete set null;
exception when duplicate_object then null; end $$;
do $$ begin alter table public.orders add constraint orders_preferred_slot_id_fkey
  foreign key (preferred_slot_id) references public.delivery_slots(id) on delete set null;
exception when duplicate_object then null; end $$;
do $$ begin alter table public.orders add constraint orders_conversation_id_fkey
  foreign key (conversation_id) references public.agent_conversations(id) on delete set null;
exception when duplicate_object then null; end $$;
do $$ begin alter table public.agent_conversations add constraint agent_conversations_user_id_fkey
  foreign key (user_id) references public.profiles(id) on delete set null;
exception when duplicate_object then null; end $$;
do $$ begin alter table public.agent_conversations add constraint agent_conversations_order_id_fkey
  foreign key (order_id) references public.orders(id) on delete set null;
exception when duplicate_object then null; end $$;
do $$ begin alter table public.agent_messages add constraint agent_messages_conversation_id_fkey
  foreign key (conversation_id) references public.agent_conversations(id) on delete cascade;
exception when duplicate_object then null; end $$;
do $$ begin alter table public.agent_pending_approvals add constraint agent_pending_approvals_conversation_id_fkey
  foreign key (conversation_id) references public.agent_conversations(id) on delete cascade;
exception when duplicate_object then null; end $$;
do $$ begin alter table public.payments add constraint payments_order_id_fkey
  foreign key (order_id) references public.orders(id) on delete set null;
exception when duplicate_object then null; end $$;
do $$ begin alter table public.payments add constraint payments_one_parent_chk
  check ((subscription_id is not null)::int + (order_id is not null)::int <= 1);
exception when duplicate_object then null; end $$;

-- 9) Indexes
create unique index if not exists uq_agent_messages_provider_msg
  on public.agent_messages (provider_message_id) where provider_message_id is not null;
create index if not exists idx_agent_messages_conv_time on public.agent_messages (conversation_id, created_at);
create index if not exists idx_agent_conv_external on public.agent_conversations (channel, external_id);
create index if not exists idx_agent_conv_status on public.agent_conversations (status);
create index if not exists idx_pending_approvals_conv on public.agent_pending_approvals (conversation_id);
create index if not exists idx_pending_approvals_open on public.agent_pending_approvals (conversation_id) where status = 'pending';
create index if not exists idx_orders_status_created on public.orders (status, created_at desc);
create index if not exists idx_orders_contact_phone on public.orders (contact_phone);
create index if not exists idx_orders_user on public.orders (user_id);
create index if not exists idx_orders_conversation on public.orders (conversation_id);
create index if not exists idx_payments_order on public.payments (order_id);

-- 10) updated_at triggers (orders + agent_conversations carry updated_at)
do $$ begin create trigger set_updated_at before update on public.orders
  for each row execute function public.tg_set_updated_at();
exception when duplicate_object then null; end $$;
do $$ begin create trigger set_updated_at before update on public.agent_conversations
  for each row execute function public.tg_set_updated_at();
exception when duplicate_object then null; end $$;

-- 11) RLS: enable; service-role (admin client) bypasses RLS and is the only writer.
alter table public.orders                   enable row level security;
alter table public.agent_conversations      enable row level security;
alter table public.agent_messages           enable row level security;
alter table public.agent_pending_approvals  enable row level security;
alter table public.processed_webhook_events enable row level security;

do $$ begin create policy "admin read orders" on public.orders
  for select using (public.is_admin());
exception when duplicate_object then null; end $$;
do $$ begin create policy "owner reads own orders" on public.orders
  for select using (user_id = auth.uid());
exception when duplicate_object then null; end $$;
do $$ begin create policy "admin read agent_conversations" on public.agent_conversations
  for select using (public.is_admin());
exception when duplicate_object then null; end $$;
do $$ begin create policy "admin read agent_messages" on public.agent_messages
  for select using (public.is_admin());
exception when duplicate_object then null; end $$;
do $$ begin create policy "admin read agent_pending_approvals" on public.agent_pending_approvals
  for select using (public.is_admin());
exception when duplicate_object then null; end $$;
do $$ begin create policy "admin read processed_webhook_events" on public.processed_webhook_events
  for select using (public.is_admin());
exception when duplicate_object then null; end $$;
