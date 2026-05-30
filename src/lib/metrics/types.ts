/**
 * Chart-ready data shapes returned by the metrics query layer and consumed by
 * the (client) dashboard widgets. Kept free of `server-only` so client
 * components can import the types without pulling in the query module.
 */
import type { Database } from '@/lib/supabase/database.types'

export type Overview = {
  activeSubscriptions: number
  mrrCents: number
  revenueLast30dCents: number
  revenueMtdCents: number
  deliveriesScheduledNext7d: number
  deliveriesCompletedLast30d: number
  failedDeliveriesLast30d: number
}

export type RevenuePoint = { day: string; revenueCents: number; count: number }

export type NewSubsPoint = { day: string; count: number }

export type DeliveryStatus = Database['public']['Enums']['delivery_status']

export type DeliveryRow = {
  id: string
  scheduledFor: string | null
  status: DeliveryStatus | null
  notes: string | null
  customerName: string | null
  customerEmail: string | null
}
