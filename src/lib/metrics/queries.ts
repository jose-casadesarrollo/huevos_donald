import 'server-only'
import { createClient } from '@/lib/supabase/server'
import type { Overview, RevenuePoint, NewSubsPoint, DeliveryRow } from './types'

/**
 * Headline KPIs from the pre-built `admin_metrics_overview` view.
 * The view returns a single row; nulls (empty DB) are coalesced to 0.
 */
export async function getOverview(): Promise<Overview> {
  const supabase = await createClient()
  const { data } = await supabase.from('admin_metrics_overview').select('*').maybeSingle()

  return {
    activeSubscriptions: data?.active_subscriptions_count ?? 0,
    mrrCents: data?.mrr_cents ?? 0,
    revenueLast30dCents: data?.revenue_last_30d_cents ?? 0,
    revenueMtdCents: data?.revenue_mtd_cents ?? 0,
    deliveriesScheduledNext7d: data?.deliveries_scheduled_next_7d ?? 0,
    deliveriesCompletedLast30d: data?.deliveries_completed_last_30d ?? 0,
    failedDeliveriesLast30d: data?.failed_deliveries_last_30d ?? 0,
  }
}

/** Daily approved revenue (admin_revenue_by_day), oldest → newest. */
export async function getRevenueByDay(): Promise<RevenuePoint[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('admin_revenue_by_day')
    .select('day, revenue_cents, payment_count')
    .order('day', { ascending: true })

  return (data ?? [])
    .filter((r) => r.day)
    .map((r) => ({
      day: r.day as string,
      revenueCents: r.revenue_cents ?? 0,
      count: r.payment_count ?? 0,
    }))
}

/** New subscriptions per day (admin_new_subscriptions_by_day), oldest → newest. */
export async function getNewSubscriptionsByDay(): Promise<NewSubsPoint[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('admin_new_subscriptions_by_day')
    .select('day, count')
    .order('day', { ascending: true })

  return (data ?? [])
    .filter((r) => r.day)
    .map((r) => ({ day: r.day as string, count: r.count ?? 0 }))
}

/** Upcoming deliveries with resolved customer identity, for the Pedidos table. */
export async function getDeliveriesForTable(): Promise<DeliveryRow[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('admin_deliveries_upcoming')
    .select('id, scheduled_for, status, notes, user_full_name, user_email')
    .order('scheduled_for', { ascending: true })

  return (data ?? [])
    .filter((r) => r.id)
    .map((r) => ({
      id: r.id as string,
      scheduledFor: r.scheduled_for,
      status: r.status,
      notes: r.notes,
      customerName: r.user_full_name,
      customerEmail: r.user_email,
    }))
}
