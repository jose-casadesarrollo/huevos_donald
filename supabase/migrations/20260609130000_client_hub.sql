-- Client Hub — unified per-client business-intelligence views.
-- Additive + idempotent. Resolves a single "client" identity across web accounts
-- (profiles), one-time orders (incl. WhatsApp/Telegram guests), subscriptions,
-- deliveries, payments and agent conversations, "smart related" by the SAME
-- normalized phone OR the SAME lowercased email, anchored on public.profiles.
--
-- Security: both views are `security_invoker = on` (PG15+), so they inherit the
-- caller's RLS. Admins satisfy public.is_admin() on every base table and see all
-- rows; the Next app reads them with the anon key (no service role). Functions are
-- SECURITY INVOKER (default) — they do NOT bypass RLS.

-- 1) normalize_phone(): digits-only canonical form. IMMUTABLE so it can back an index.
--    '+56 9 1234 5678' and '56912345678' both fold to '56912345678'.
create or replace function public.normalize_phone(p text)
returns text language sql immutable returns null on null input
set search_path = ''
as $$
  select nullif(regexp_replace(p, '\D', '', 'g'), '')
$$;

-- 2) resolve_client_key(): profile-anchored canonical key. STABLE (reads profiles).
--    Precedence: own user_id -> adopt a profile by normalized phone -> by lowercased
--    email -> else a guest key ('p:'<phone> or 'e:'<email>). Deterministic: when two
--    profiles share a phone/email the oldest wins; the other stays a distinct client
--    (safe + visible, never a silent many-to-one merge).
create or replace function public.resolve_client_key(p_user_id uuid, p_phone text, p_email text)
returns text language sql stable
set search_path = ''
as $$
  select case
    when p_user_id is not null then 'u:' || p_user_id::text
    else coalesce(
      (select 'u:' || pr.id::text
         from public.profiles pr
        where public.normalize_phone(pr.phone) is not null
          and public.normalize_phone(pr.phone) = public.normalize_phone(p_phone)
        order by pr.created_at asc
        limit 1),
      (select 'u:' || pr.id::text
         from public.profiles pr
        where p_email is not null
          and lower(pr.email) = lower(p_email)
        order by pr.created_at asc
        limit 1),
      case when public.normalize_phone(p_phone) is not null
           then 'p:' || public.normalize_phone(p_phone) end,
      case when nullif(lower(p_email), '') is not null
           then 'e:' || lower(p_email) end
    )
  end
$$;

-- 3) Functional indexes that make the adoption lookups cheap.
create index if not exists idx_profiles_norm_phone on public.profiles (public.normalize_phone(phone));
create index if not exists idx_profiles_lower_email on public.profiles (lower(email));

-- 4) client_identities: one row per source record, mapped to its canonical client_key.
--    The reusable resolution layer. Telegram guest conversations (no user_id, non-e164
--    external_id) are excluded so a chat id is never mistaken for a phone.
create or replace view public.client_identities with (security_invoker = on) as
  -- profiles (the anchor: guarantees a client row even with no activity)
  select 'u:' || p.id::text          as client_key,
         p.id                        as profile_id,
         'profile'::text             as source,
         p.id                        as source_id,
         null::text                  as channel,
         p.updated_at                as activity_at
  from public.profiles p
  union all
  -- one-time orders (account, adopted-guest, or pure guest)
  select public.resolve_client_key(o.user_id, o.contact_phone, null),
         o.user_id,
         'order',
         o.id,
         case when o.source = 'web' then 'web' else 'chatbot' end,
         o.created_at
  from public.orders o
  union all
  -- subscriptions (always carry user_id)
  select 'u:' || s.user_id::text,
         s.user_id,
         'subscription',
         s.id,
         case when s.source = 'web' then 'web' else 'chatbot' end,
         greatest(s.created_at, coalesce(s.started_at, s.created_at))
  from public.subscriptions s
  union all
  -- deliveries (always carry user_id)
  select 'u:' || d.user_id::text,
         d.user_id,
         'delivery',
         d.id,
         null::text,
         greatest(d.created_at, coalesce(d.delivery_date::timestamptz, d.created_at))
  from public.deliveries d
  union all
  -- chatbot conversations (whatsapp external_id is e164 by CHECK; telegram guests skipped)
  select case when c.user_id is not null then 'u:' || c.user_id::text
              when c.channel = 'whatsapp' then public.resolve_client_key(null, c.external_id, null)
         end,
         c.user_id,
         'conversation',
         c.id,
         'chatbot',
         greatest(c.created_at, coalesce(c.last_inbound_at, c.created_at),
                  coalesce(c.last_outbound_at, c.created_at))
  from public.agent_conversations c
  where c.user_id is not null or c.channel = 'whatsapp';

-- 5) admin_clients: one aggregated row per client_key. Built entirely on top of
--    client_identities (single source of truth for key resolution) joined to base
--    tables for money / eggs / balances / contact fields.
create or replace view public.admin_clients with (security_invoker = on) as
with ci as (
  select * from public.client_identities where client_key is not null
),
keys as (
  select client_key,
         max(profile_id)                                          as profile_id,
         max(activity_at)                                         as last_activity_at,
         bool_or(channel = 'web')                                 as has_web,
         bool_or(channel = 'chatbot')                             as has_chatbot,
         count(*) filter (where source = 'order')::int            as orders_count,
         count(*) filter (where source = 'subscription')::int     as subscriptions_count,
         count(*) filter (where source = 'conversation')::int     as conversations_count
  from ci
  group by client_key
),
order_ident as (select source_id as order_id, client_key from ci where source = 'order'),
sub_ident   as (select source_id as subscription_id, client_key from ci where source = 'subscription'),
ord as (
  select oi.client_key,
         (array_agg(o.contact_name order by o.created_at desc)
            filter (where o.contact_name is not null))[1]               as order_name,
         (array_agg(public.normalize_phone(o.contact_phone) order by o.created_at desc)
            filter (where o.contact_phone is not null))[1]              as order_phone
  from public.orders o
  join order_ident oi on oi.order_id = o.id
  group by oi.client_key
),
sub as (
  select si.client_key,
         sum(s.egg_balance)::int                                        as egg_balance,
         min(s.started_at)                                             as subscriber_since,
         (array_agg(s.status order by case s.status
             when 'authorized' then 1 when 'past_due' then 2 when 'paused' then 3
             when 'pending' then 4 when 'cancelled' then 5 else 6 end))[1] as subscription_status,
         (array_agg(s.contact_email order by s.created_at desc)
            filter (where s.contact_email is not null))[1]             as sub_email,
         (array_agg(public.normalize_phone(s.contact_phone) order by s.created_at desc)
            filter (where s.contact_phone is not null))[1]             as sub_phone
  from public.subscriptions s
  join sub_ident si on si.subscription_id = s.id
  group by si.client_key
),
deliv as (
  select dci.client_key,
         coalesce(sum(d.quantity) filter (where d.status = 'delivered'), 0)::int as total_eggs_delivered
  from public.deliveries d
  join ci dci on dci.source = 'delivery' and dci.source_id = d.id
  group by dci.client_key
),
pay as (
  select coalesce(oi.client_key, si.client_key)                       as client_key,
         coalesce(sum(pm.amount_cents) filter (where pm.status = 'approved'), 0)::bigint as total_paid_cents
  from public.payments pm
  left join order_ident oi on oi.order_id = pm.order_id
  left join sub_ident   si on si.subscription_id = pm.subscription_id
  where coalesce(oi.client_key, si.client_key) is not null
  group by coalesce(oi.client_key, si.client_key)
)
select
  k.client_key,
  k.profile_id,
  (k.profile_id is not null)                                          as has_account,
  coalesce(pr.full_name, ord.order_name)                             as name,
  coalesce(public.normalize_phone(pr.phone), ord.order_phone, sub.sub_phone,
           case when k.client_key like 'p:%' then substring(k.client_key from 3) end) as phone,
  coalesce(lower(pr.email), sub.sub_email,
           case when k.client_key like 'e:%' then substring(k.client_key from 3) end) as email,
  coalesce(k.has_web, false)                                         as channel_web,
  coalesce(k.has_chatbot, false)                                     as channel_chatbot,
  sub.subscription_status,
  sub.subscriber_since,
  coalesce(pay.total_paid_cents, 0)                                  as total_paid_cents,
  coalesce(deliv.total_eggs_delivered, 0)                            as total_eggs_delivered,
  k.orders_count,
  k.subscriptions_count,
  k.conversations_count,
  k.last_activity_at,
  coalesce(pr.points_balance, 0)                                     as points_balance,
  coalesce(sub.egg_balance, 0)                                       as egg_balance
from keys k
left join public.profiles pr on pr.id = k.profile_id
left join ord   on ord.client_key   = k.client_key
left join sub   on sub.client_key   = k.client_key
left join deliv on deliv.client_key = k.client_key
left join pay   on pay.client_key   = k.client_key;

-- 6) Grants — match the existing admin_* views. Real exposure is still gated by RLS
--    (security_invoker) + the /admin route guard.
grant select on public.client_identities to anon, authenticated;
grant select on public.admin_clients     to anon, authenticated;
