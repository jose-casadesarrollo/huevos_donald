'use server'

import { randomUUID } from 'node:crypto'
import { revalidatePath } from 'next/cache'
import type { SupabaseClient, User } from '@supabase/supabase-js'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/auth/roles'
import { getClientDetail } from '@/lib/admin/clients/queries'
import type { Database } from '@/lib/supabase/database.types'
import type { ActionResult } from '@/lib/admin/config/types'
import type { ClientDetail } from '@/lib/admin/clients/types'

type Client = SupabaseClient<Database>

const PATH = '/admin/clients'
const nowIso = () => new Date().toISOString()

function message(e: unknown): string {
  return e instanceof Error ? e.message : 'Error desconocido'
}

function check(error: { message: string } | null): void {
  if (error) throw new Error(error.message)
}

/** Digits-only phone (matches the rest of the schema's `56XXXXXXXXX`). */
function normalizePhone(p: string): string {
  return p.replace(/\D/g, '')
}
function isPhone(p: string): boolean {
  return /^56[0-9]{8,9}$/.test(p)
}
function isEmail(e: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)
}

/**
 * Admin-gated mutation over the service role. Used for the customer tables
 * (`profiles`, `subscriptions`, ledgers, auth) which have no authenticated write
 * policy — writes are admin-only via the `requireAdmin()` guard. Mirrors the
 * `withService` wrapper in `src/app/admin/settings/actions.ts`.
 */
async function withService(
  fn: (sb: Client, user: User) => Promise<void>,
): Promise<ActionResult> {
  const user = await requireAdmin()
  const supabase = createAdminClient()
  try {
    await fn(supabase, user)
    revalidatePath(PATH)
    return { ok: true }
  } catch (e) {
    return { ok: false, error: message(e) }
  }
}

/** Admin-guarded detail fetch, called from the Client Hub Sheet on row open. */
export async function getClientDetailAction(
  clientKey: string,
): Promise<ClientDetail | null> {
  await requireAdmin()
  return getClientDetail(clientKey)
}

/**
 * Create a customer: an auth user (email OR phone) + a profile row. The phone is
 * normalized to `56XXXXXXXXX`, so the new account auto-merges with any existing
 * guest order/conversation on the same number in `admin_clients`.
 */
export async function createCustomer(input: {
  idType: 'email' | 'phone'
  idValue: string
  fullName: string | null
  phone: string | null
  email: string | null
  addressLine1: string | null
  city: string | null
  deliveryZoneId: string | null
}): Promise<ActionResult> {
  return withService(async (sb) => {
    const fullName = input.fullName?.trim() || null
    let email = input.email?.trim().toLowerCase() || null
    let phone = input.phone ? normalizePhone(input.phone) : null

    if (input.idType === 'email') {
      email = input.idValue.trim().toLowerCase()
      if (!isEmail(email)) throw new Error('Correo inválido.')
    } else {
      phone = normalizePhone(input.idValue)
      if (!isPhone(phone))
        throw new Error('Teléfono inválido (formato 56XXXXXXXXX).')
    }
    if (phone && !isPhone(phone))
      throw new Error('Teléfono inválido (formato 56XXXXXXXXX).')

    const created =
      input.idType === 'email'
        ? await sb.auth.admin.createUser({
            email: email!,
            email_confirm: true,
            password: randomUUID(),
          })
        : await sb.auth.admin.createUser({
            phone: phone!,
            phone_confirm: true,
            password: randomUUID(),
          })
    if (created.error) throw new Error(created.error.message)
    const userId = created.data.user?.id
    if (!userId) throw new Error('No se pudo crear la cuenta.')

    // Upsert in case a `handle_new_user` trigger already inserted a stub profile.
    check(
      (
        await sb.from('profiles').upsert(
          {
            id: userId,
            full_name: fullName,
            email,
            phone,
            address_line1: input.addressLine1?.trim() || null,
            city: input.city?.trim() || null,
            delivery_zone_id: input.deliveryZoneId,
            updated_at: nowIso(),
          },
          { onConflict: 'id' },
        )
      ).error,
    )
  })
}

/** Edit a client's contact + delivery profile fields (not the auth login identity). */
export async function updateClientProfile(input: {
  id: string
  fullName: string | null
  phone: string | null
  email: string | null
  addressLine1: string | null
  addressLine2: string | null
  city: string | null
  deliveryZoneId: string | null
  deliveryNotes: string | null
}): Promise<ActionResult> {
  return withService(async (sb) => {
    if (!input.id) throw new Error('Cliente inválido.')
    const phone = input.phone ? normalizePhone(input.phone) : null
    if (phone && !isPhone(phone))
      throw new Error('Teléfono inválido (formato 56XXXXXXXXX).')
    const email = input.email?.trim().toLowerCase() || null
    if (email && !isEmail(email)) throw new Error('Correo inválido.')
    check(
      (
        await sb
          .from('profiles')
          .update({
            full_name: input.fullName?.trim() || null,
            phone,
            email,
            address_line1: input.addressLine1?.trim() || null,
            address_line2: input.addressLine2?.trim() || null,
            city: input.city?.trim() || null,
            delivery_zone_id: input.deliveryZoneId,
            delivery_notes: input.deliveryNotes?.trim() || null,
            updated_at: nowIso(),
          })
          .eq('id', input.id)
      ).error,
    )
  })
}

/**
 * Update the SAFE (non-MercadoPago) subscription fields only. `status`, `plan_id`,
 * `mercadopago_subscription_id`, `next_billing_at` etc. are owned by MP/webhook and
 * are intentionally never touched here.
 */
export async function updateSubscription(input: {
  id: string
  deliveryZoneId: string | null
  preferredSlotId: string | null
  preferredWeekday: number | null
  contactEmail: string | null
  contactPhone: string | null
  resumeAt: string | null
}): Promise<ActionResult> {
  return withService(async (sb) => {
    if (!input.id) throw new Error('Suscripción inválida.')
    if (
      input.preferredWeekday != null &&
      (input.preferredWeekday < 0 || input.preferredWeekday > 6)
    ) {
      throw new Error('Día de la semana inválido.')
    }
    const phone = input.contactPhone ? normalizePhone(input.contactPhone) : null
    if (phone && !isPhone(phone))
      throw new Error('Teléfono inválido (formato 56XXXXXXXXX).')
    const email = input.contactEmail?.trim().toLowerCase() || null
    if (email && !isEmail(email)) throw new Error('Correo inválido.')
    check(
      (
        await sb
          .from('subscriptions')
          .update({
            delivery_zone_id: input.deliveryZoneId,
            preferred_slot_id: input.preferredSlotId,
            preferred_weekday: input.preferredWeekday,
            contact_email: email,
            contact_phone: phone,
            resume_at: input.resumeAt,
            updated_at: nowIso(),
          })
          .eq('id', input.id)
      ).error,
    )
  })
}

/**
 * Adjust egg balance by inserting an append-only `egg_ledger` row (a trigger syncs
 * `subscriptions.egg_balance`). Same contract as settings; revalidates the hub path.
 */
export async function adjustEggBalance(input: {
  user_id: string
  subscription_id: string | null
  delta: number
  note: string | null
}): Promise<ActionResult> {
  return withService(async (sb) => {
    if (!input.user_id) throw new Error('Cliente inválido.')
    if (!Number.isInteger(input.delta) || input.delta === 0) {
      throw new Error('El ajuste debe ser un entero distinto de 0.')
    }
    check(
      (
        await sb.from('egg_ledger').insert({
          user_id: input.user_id,
          subscription_id: input.subscription_id,
          delta: input.delta,
          reason: 'adjustment',
          note: input.note,
        })
      ).error,
    )
  })
}

/** Adjust points by inserting an append-only `points_ledger` row (trigger syncs cache). */
export async function adjustPoints(input: {
  user_id: string
  delta: number
  note: string | null
}): Promise<ActionResult> {
  return withService(async (sb) => {
    if (!input.user_id) throw new Error('Cliente inválido.')
    if (!Number.isInteger(input.delta) || input.delta === 0) {
      throw new Error('El ajuste debe ser un entero distinto de 0.')
    }
    check(
      (
        await sb.from('points_ledger').insert({
          user_id: input.user_id,
          delta: input.delta,
          reason: 'adjustment',
          note: input.note,
        })
      ).error,
    )
  })
}
