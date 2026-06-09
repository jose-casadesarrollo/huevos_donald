import type { Database } from '@/lib/supabase/database.types'

type Enums = Database['public']['Enums']
type Views = Database['public']['Views']

/** Web vs chatbot (WhatsApp) purchase channel. A client may use both. */
export type Channel = 'web' | 'chatbot'

/** Generated row of the unified `admin_clients` view (authoritative). */
export type AdminClientRow = Views['admin_clients']['Row']

/** One unified client for the Client Hub table (camelCase projection). */
export type ClientListItem = {
  clientKey: string
  profileId: string | null
  hasAccount: boolean
  name: string | null
  phone: string | null
  email: string | null
  channels: Channel[]
  subscriptionStatus: Enums['subscription_status'] | null
  subscriberSince: string | null
  totalPaidCents: number
  totalEggsDelivered: number
  ordersCount: number
  subscriptionsCount: number
  conversationsCount: number
  lastActivityAt: string | null
  pointsBalance: number
  eggBalance: number
}

export type ClientOrder = {
  id: string
  createdAt: string
  quantity: number
  amountCents: number
  status: Enums['order_status']
  channel: Channel
}

export type ClientDelivery = {
  id: string
  deliveryDate: string | null
  scheduledFor: string | null
  quantity: number | null
  status: Enums['delivery_status']
}

export type ClientSubscription = {
  id: string
  planName: string | null
  status: Enums['subscription_status']
  source: Channel
  startedAt: string | null
  nextBillingAt: string | null
  cancelledAt: string | null
  pausedAt: string | null
  eggBalance: number
  // Admin-editable (safe, non-MercadoPago) fields:
  deliveryZoneId: string | null
  preferredSlotId: string | null
  preferredWeekday: number | null
  contactEmail: string | null
  contactPhone: string | null
  resumeAt: string | null
}

/** Editable profile fields for the edit-client form (account clients only). */
export type ClientProfile = {
  id: string
  fullName: string | null
  phone: string | null
  email: string | null
  addressLine1: string | null
  addressLine2: string | null
  city: string | null
  deliveryZoneId: string | null
  deliveryNotes: string | null
}

/** Delivery zone / slot options for the edit forms' pickers. */
export type ZoneOption = {
  id: string
  name: string
  comuna: string | null
  active: boolean
}
export type SlotOption = { id: string; name: string }
export type ClientFormData = { zones: ZoneOption[]; slots: SlotOption[] }

/** Daily approved spend, for the detail mini-chart. */
export type SpendPoint = { day: string; revenueCents: number }
/** Daily order count, for the detail mini-chart. */
export type OrdersPoint = { day: string; count: number }

export type ClientDetail = {
  client: ClientListItem
  profile: ClientProfile | null
  orders: ClientOrder[]
  deliveries: ClientDelivery[]
  subscriptions: ClientSubscription[]
  spendSeries: SpendPoint[]
  ordersSeries: OrdersPoint[]
}
