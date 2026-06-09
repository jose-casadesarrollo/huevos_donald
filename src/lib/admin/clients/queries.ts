import 'server-only'
import { createClient } from '@/lib/supabase/server'
import type {
  AdminClientRow,
  Channel,
  ClientDetail,
  ClientFormData,
  ClientListItem,
  ClientOrder,
  ClientDelivery,
  ClientProfile,
  ClientSubscription,
  SpendPoint,
} from './types'

/** Delivery zones + slots for the create/edit forms' pickers. */
export async function getClientFormData(): Promise<ClientFormData> {
  const supabase = await createClient()
  const [zonesRes, slotsRes] = await Promise.all([
    supabase
      .from('delivery_zones')
      .select('id, name, comuna, active')
      .order('active', { ascending: false })
      .order('name'),
    supabase.from('delivery_slots').select('id, name').order('sort_order'),
  ])

  return {
    zones: (zonesRes.data ?? []).map((z) => ({
      id: z.id,
      name: z.name,
      comuna: z.comuna,
      active: z.active,
    })),
    slots: (slotsRes.data ?? []).map((s) => ({ id: s.id, name: s.name })),
  }
}

/**
 * Unified client list from the `admin_clients` view (web + chatbot, smart-related
 * by phone/email in SQL). RLS-bound SSR client — an admin session sees every row.
 * Mirrors `getDeliveriesForTable` in `src/lib/metrics/queries.ts`.
 */
export async function getClients(): Promise<ClientListItem[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('admin_clients')
    .select('*')
    .order('last_activity_at', { ascending: false, nullsFirst: false })

  return (data ?? []).filter((r) => r.client_key).map(toListItem)
}

/**
 * Per-client BI payload for the detail Sheet. Resolves the canonical `client_key`
 * to the underlying rows: account history by `user_id`, plus phone-matched guest
 * orders so a chatbot order made before signup still shows under the account.
 */
export async function getClientDetail(
  clientKey: string,
): Promise<ClientDetail | null> {
  const supabase = await createClient()

  const { data: row } = await supabase
    .from('admin_clients')
    .select('*')
    .eq('client_key', clientKey)
    .maybeSingle()
  if (!row) return null

  const client = toListItem(row)
  const { profileId, phone } = client

  // Orders: account rows (user_id) + phone-matched guest rows.
  const orderFilters: string[] = []
  if (profileId) orderFilters.push(`user_id.eq.${profileId}`)
  if (phone) orderFilters.push(`contact_phone.eq.${phone}`)

  let orders: ClientOrder[] = []
  let orderIds: string[] = []
  if (orderFilters.length) {
    const { data } = await supabase
      .from('orders')
      .select('id, created_at, quantity, amount_cents, status, source')
      .or(orderFilters.join(','))
      .order('created_at', { ascending: false })
    orders = (data ?? []).map((o) => ({
      id: o.id,
      createdAt: o.created_at,
      quantity: o.quantity,
      amountCents: o.amount_cents,
      status: o.status,
      channel: toChannel(o.source),
    }))
    orderIds = (data ?? []).map((o) => o.id)
  }

  // Deliveries + subscriptions exist only for account (user_id) clients.
  let profile: ClientProfile | null = null
  let deliveries: ClientDelivery[] = []
  let subscriptions: ClientSubscription[] = []
  let subIds: string[] = []
  if (profileId) {
    const [profileRes, deliveryRes, subRes] = await Promise.all([
      supabase
        .from('profiles')
        .select(
          'id, full_name, phone, email, address_line1, address_line2, city, delivery_zone_id, delivery_notes',
        )
        .eq('id', profileId)
        .maybeSingle(),
      supabase
        .from('deliveries')
        .select('id, delivery_date, scheduled_for, quantity, status')
        .eq('user_id', profileId)
        .order('scheduled_for', { ascending: false })
        .limit(50),
      supabase
        .from('subscriptions')
        .select(
          'id, status, source, started_at, next_billing_at, cancelled_at, paused_at, egg_balance, delivery_zone_id, preferred_slot_id, preferred_weekday, contact_email, contact_phone, resume_at, plans(name)',
        )
        .eq('user_id', profileId)
        .order('created_at', { ascending: false }),
    ])
    if (profileRes.data) {
      const p = profileRes.data
      profile = {
        id: p.id,
        fullName: p.full_name,
        phone: p.phone,
        email: p.email,
        addressLine1: p.address_line1,
        addressLine2: p.address_line2,
        city: p.city,
        deliveryZoneId: p.delivery_zone_id,
        deliveryNotes: p.delivery_notes,
      }
    }
    deliveries = (deliveryRes.data ?? []).map((d) => ({
      id: d.id,
      deliveryDate: d.delivery_date,
      scheduledFor: d.scheduled_for,
      quantity: d.quantity,
      status: d.status,
    }))
    subscriptions = (subRes.data ?? []).map((s) => ({
      id: s.id,
      planName: planName(s.plans),
      status: s.status,
      source: toChannel(s.source),
      startedAt: s.started_at,
      nextBillingAt: s.next_billing_at,
      cancelledAt: s.cancelled_at,
      pausedAt: s.paused_at,
      eggBalance: s.egg_balance,
      deliveryZoneId: s.delivery_zone_id,
      preferredSlotId: s.preferred_slot_id,
      preferredWeekday: s.preferred_weekday,
      contactEmail: s.contact_email,
      contactPhone: s.contact_phone,
      resumeAt: s.resume_at,
    }))
    subIds = (subRes.data ?? []).map((s) => s.id)
  }

  // Approved payments → spend series. Attach via user_id or the parent order/sub.
  const payFilters: string[] = []
  if (profileId) payFilters.push(`user_id.eq.${profileId}`)
  if (orderIds.length) payFilters.push(`order_id.in.(${orderIds.join(',')})`)
  if (subIds.length) payFilters.push(`subscription_id.in.(${subIds.join(',')})`)

  let spendSeries: SpendPoint[] = []
  if (payFilters.length) {
    const { data } = await supabase
      .from('payments')
      .select('amount_cents, paid_at, created_at, status')
      .eq('status', 'approved')
      .or(payFilters.join(','))
    spendSeries = bucketByDay(
      (data ?? []).map((p) => ({
        day: (p.paid_at ?? p.created_at).slice(0, 10),
        value: p.amount_cents,
      })),
    ).map((b) => ({ day: b.day, revenueCents: b.value }))
  }

  const ordersSeries = bucketByDay(
    orders.map((o) => ({ day: o.createdAt.slice(0, 10), value: 1 })),
  ).map((b) => ({ day: b.day, count: b.value }))

  return {
    client,
    profile,
    orders,
    deliveries,
    subscriptions,
    spendSeries,
    ordersSeries,
  }
}

// --- helpers ---------------------------------------------------------------

function toChannel(source: string): Channel {
  return source === 'web' ? 'web' : 'chatbot'
}

function toListItem(row: AdminClientRow): ClientListItem {
  const channels: Channel[] = []
  if (row.channel_web) channels.push('web')
  if (row.channel_chatbot) channels.push('chatbot')
  return {
    clientKey: row.client_key ?? '',
    profileId: row.profile_id,
    hasAccount: row.has_account ?? false,
    name: row.name,
    phone: row.phone,
    email: row.email,
    channels,
    subscriptionStatus: row.subscription_status,
    subscriberSince: row.subscriber_since,
    totalPaidCents: row.total_paid_cents ?? 0,
    totalEggsDelivered: row.total_eggs_delivered ?? 0,
    ordersCount: row.orders_count ?? 0,
    subscriptionsCount: row.subscriptions_count ?? 0,
    conversationsCount: row.conversations_count ?? 0,
    lastActivityAt: row.last_activity_at,
    pointsBalance: row.points_balance ?? 0,
    eggBalance: row.egg_balance ?? 0,
  }
}

/** Embedded `plans(name)` may arrive as an object or a one-element array. */
function planName(plans: unknown): string | null {
  if (!plans) return null
  const p = Array.isArray(plans) ? plans[0] : plans
  return (p as { name?: string } | undefined)?.name ?? null
}

/** Sum `value` per `day`, returned oldest → newest. */
function bucketByDay(
  points: { day: string; value: number }[],
): { day: string; value: number }[] {
  const map = new Map<string, number>()
  for (const { day, value } of points) map.set(day, (map.get(day) ?? 0) + value)
  return [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([day, value]) => ({ day, value }))
}
