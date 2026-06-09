'use server'

import { randomUUID } from 'node:crypto'
import { revalidatePath } from 'next/cache'
import type { SupabaseClient, User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/auth/roles'
import type { Database, Json } from '@/lib/supabase/database.types'
import type { ActionResult, Enums } from '@/lib/admin/config/types'
import { AGENT_MODEL_OPTIONS, AGENT_TEMPERATURE } from '@/lib/admin/config/labels'

type Client = SupabaseClient<Database>

const PATH = '/admin/settings'
const nowIso = () => new Date().toISOString()

function message(e: unknown): string {
  return e instanceof Error ? e.message : 'Error desconocido'
}

/** Throw on a Supabase error so the wrapper can report it. */
function check(error: { message: string } | null): void {
  if (error) throw new Error(error.message)
}

/** Admin-gated mutation over the RLS-bound client (writes pass `is_admin()`). */
async function withAdmin(fn: (sb: Client, user: User) => Promise<void>): Promise<ActionResult> {
  const user = await requireAdmin()
  const supabase = await createClient()
  try {
    await fn(supabase, user)
    revalidatePath(PATH)
    return { ok: true }
  } catch (e) {
    return { ok: false, error: message(e) }
  }
}

/** Admin-gated mutation over the service role (for tables with no authenticated INSERT policy). */
async function withService(fn: (sb: Client, user: User) => Promise<void>): Promise<ActionResult> {
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

// ===========================================================================
// 1. Cobertura & días
// ===========================================================================

export async function upsertZone(input: {
  id?: string
  name: string
  comuna: string | null
  notes: string | null
  active: boolean
}): Promise<ActionResult> {
  return withAdmin(async (sb) => {
    if (!input.name.trim()) throw new Error('El nombre es obligatorio.')
    if (input.id) {
      check(
        (
          await sb
            .from('delivery_zones')
            .update({ name: input.name, comuna: input.comuna, notes: input.notes, active: input.active, updated_at: nowIso() })
            .eq('id', input.id)
        ).error,
      )
    } else {
      check((await sb.from('delivery_zones').insert({ name: input.name, comuna: input.comuna, notes: input.notes, active: input.active })).error)
    }
  })
}

export async function setZoneActive(id: string, active: boolean): Promise<ActionResult> {
  return withAdmin(async (sb) => {
    check((await sb.from('delivery_zones').update({ active, updated_at: nowIso() }).eq('id', id)).error)
  })
}

/** Toggle (swap) a delivery weekday for a zone — upsert on UNIQUE(zone_id, weekday). */
export async function setZoneDay(zoneId: string, weekday: number, active: boolean): Promise<ActionResult> {
  return withAdmin(async (sb) => {
    if (weekday < 0 || weekday > 6) throw new Error('Día de la semana inválido.')
    check(
      (await sb.from('delivery_zone_days').upsert({ zone_id: zoneId, weekday, active }, { onConflict: 'zone_id,weekday' })).error,
    )
  })
}

// ===========================================================================
// 2. Horarios & cupos
// ===========================================================================

export async function upsertSlot(input: {
  id?: string
  name: string
  start_time: string // 'HH:mm'
  end_time: string // 'HH:mm'
  sort_order: number
  active: boolean
}): Promise<ActionResult> {
  return withAdmin(async (sb) => {
    if (!input.name.trim()) throw new Error('El nombre es obligatorio.')
    if (input.end_time <= input.start_time) throw new Error('La hora de término debe ser mayor a la de inicio.')
    const row = {
      name: input.name,
      start_time: input.start_time,
      end_time: input.end_time,
      sort_order: input.sort_order,
      active: input.active,
    }
    if (input.id) {
      check((await sb.from('delivery_slots').update({ ...row, updated_at: nowIso() }).eq('id', input.id)).error)
    } else {
      check((await sb.from('delivery_slots').insert(row)).error)
    }
  })
}

export async function setSlotActive(id: string, active: boolean): Promise<ActionResult> {
  return withAdmin(async (sb) => {
    check((await sb.from('delivery_slots').update({ active, updated_at: nowIso() }).eq('id', id)).error)
  })
}

/** Set capacity for a (zone, slot) — upsert on UNIQUE(zone_id, slot_id). */
export async function setCapacity(zoneId: string, slotId: string, maxOrders: number): Promise<ActionResult> {
  return withAdmin(async (sb) => {
    if (!Number.isInteger(maxOrders) || maxOrders < 0) throw new Error('El cupo debe ser un entero ≥ 0.')
    check(
      (
        await sb
          .from('slot_capacity')
          .upsert({ zone_id: zoneId, slot_id: slotId, max_orders: maxOrders, updated_at: nowIso() }, { onConflict: 'zone_id,slot_id' })
      ).error,
    )
  })
}

// ===========================================================================
// 3. Feriados & bloqueos
// ===========================================================================

export async function addBlackout(input: { date: string; zone_id: string | null; reason: string | null }): Promise<ActionResult> {
  return withAdmin(async (sb) => {
    if (!input.date) throw new Error('La fecha es obligatoria.')
    check((await sb.from('delivery_blackout_dates').insert({ date: input.date, zone_id: input.zone_id, reason: input.reason })).error)
  })
}

export async function deleteBlackout(id: string): Promise<ActionResult> {
  return withAdmin(async (sb) => {
    check((await sb.from('delivery_blackout_dates').delete().eq('id', id)).error)
  })
}

// ===========================================================================
// 4. Planes & precios
// ===========================================================================

export async function upsertPlan(input: {
  id?: string
  product_id: string
  name: string
  slug: string | null
  description: string | null
  frequency: Enums['plan_frequency']
  quantity_per_delivery: number
  price_cents: number
  active: boolean
}): Promise<ActionResult> {
  return withAdmin(async (sb) => {
    if (!input.name.trim()) throw new Error('El nombre es obligatorio.')
    if (!input.product_id) throw new Error('Selecciona un producto.')
    if (!Number.isInteger(input.price_cents) || input.price_cents < 0) throw new Error('Precio inválido.')
    if (!Number.isInteger(input.quantity_per_delivery) || input.quantity_per_delivery <= 0) throw new Error('Cantidad inválida.')
    const row = {
      product_id: input.product_id,
      name: input.name,
      slug: input.slug,
      description: input.description,
      frequency: input.frequency,
      quantity_per_delivery: input.quantity_per_delivery,
      price_cents: input.price_cents,
      active: input.active,
    }
    if (input.id) {
      check((await sb.from('plans').update({ ...row, updated_at: nowIso() }).eq('id', input.id)).error)
    } else {
      check((await sb.from('plans').insert(row)).error)
    }
  })
}

export async function setPlanActive(id: string, active: boolean): Promise<ActionResult> {
  return withAdmin(async (sb) => {
    check((await sb.from('plans').update({ active, updated_at: nowIso() }).eq('id', id)).error)
  })
}

export async function upsertProduct(input: {
  id?: string
  sku: string
  name: string
  description: string | null
  image_url: string | null
  active: boolean
}): Promise<ActionResult> {
  return withAdmin(async (sb) => {
    if (!input.name.trim()) throw new Error('El nombre es obligatorio.')
    if (!input.sku.trim()) throw new Error('El SKU es obligatorio.')
    const row = { sku: input.sku, name: input.name, description: input.description, image_url: input.image_url, active: input.active }
    if (input.id) {
      check((await sb.from('products').update({ ...row, updated_at: nowIso() }).eq('id', input.id)).error)
    } else {
      check((await sb.from('products').insert(row)).error)
    }
  })
}

// ===========================================================================
// 5. Políticas & ajustes (app_settings)
// ===========================================================================

export async function updateSetting(key: string, value: Json): Promise<ActionResult> {
  return withAdmin(async (sb) => {
    // updated_at is maintained by the set_updated_at trigger — do not set it here.
    check((await sb.from('app_settings').update({ value }).eq('key', key)).error)
  })
}

// ===========================================================================
// 6. Cupones
// ===========================================================================

export async function upsertCoupon(input: {
  id?: string
  code: string
  type: Enums['coupon_type']
  value: number
  reason: string | null
  max_redemptions: number
  valid_until: string | null // ISO date or null
  status: Enums['coupon_status']
  user_id: string | null
}): Promise<ActionResult> {
  return withAdmin(async (sb) => {
    if (!input.code.trim()) throw new Error('El código es obligatorio.')
    if (input.type === 'percent' && (input.value < 1 || input.value > 100)) throw new Error('El porcentaje debe estar entre 1 y 100.')
    if (input.value <= 0) throw new Error('El valor debe ser mayor a 0.')
    if (!Number.isInteger(input.max_redemptions) || input.max_redemptions < 1) throw new Error('Máx. de canjes inválido.')
    const row = {
      code: input.code.trim().toUpperCase(),
      type: input.type,
      value: input.value,
      reason: input.reason,
      max_redemptions: input.max_redemptions,
      valid_until: input.valid_until,
      status: input.status,
      user_id: input.user_id,
    }
    if (input.id) {
      check((await sb.from('coupons').update(row).eq('id', input.id)).error)
    } else {
      check((await sb.from('coupons').insert(row)).error)
    }
  })
}

export async function setCouponStatus(id: string, status: Enums['coupon_status']): Promise<ActionResult> {
  return withAdmin(async (sb) => {
    check((await sb.from('coupons').update({ status }).eq('id', id)).error)
  })
}

// ===========================================================================
// 7. Saldo & Puntos (service-role ledger inserts)
// ===========================================================================

export async function adjustEggBalance(input: {
  user_id: string
  subscription_id: string | null
  delta: number
  note: string | null
  value_cents_per_unit: number | null
}): Promise<ActionResult> {
  return withService(async (sb) => {
    if (!input.user_id) throw new Error('Selecciona un cliente.')
    if (!Number.isInteger(input.delta) || input.delta === 0) throw new Error('El ajuste debe ser un entero distinto de 0.')
    check(
      (
        await sb.from('egg_ledger').insert({
          user_id: input.user_id,
          subscription_id: input.subscription_id,
          delta: input.delta,
          reason: 'adjustment',
          value_cents_per_unit: input.value_cents_per_unit,
          note: input.note,
        })
      ).error,
    )
  })
}

export async function adjustPoints(input: { user_id: string; delta: number; note: string | null }): Promise<ActionResult> {
  return withService(async (sb) => {
    if (!input.user_id) throw new Error('Selecciona un cliente.')
    if (!Number.isInteger(input.delta) || input.delta === 0) throw new Error('El ajuste debe ser un entero distinto de 0.')
    check(
      (await sb.from('points_ledger').insert({ user_id: input.user_id, delta: input.delta, reason: 'adjustment', note: input.note })).error,
    )
  })
}

// ===========================================================================
// 8. Lotes / Trazabilidad
// ===========================================================================

export async function upsertLot(input: {
  id?: string
  lot_code: string
  product_id: string | null
  postura_date: string | null
  classification_date: string | null
  prepared_date: string | null
  dispatch_date: string | null
  notes: string | null
}): Promise<ActionResult> {
  return withAdmin(async (sb) => {
    if (!input.lot_code.trim()) throw new Error('El código de lote es obligatorio.')
    const row = {
      lot_code: input.lot_code.trim(),
      product_id: input.product_id,
      postura_date: input.postura_date,
      classification_date: input.classification_date,
      prepared_date: input.prepared_date,
      dispatch_date: input.dispatch_date,
      notes: input.notes,
    }
    if (input.id) {
      check((await sb.from('production_lots').update({ ...row, updated_at: nowIso() }).eq('id', input.id)).error)
    } else {
      check((await sb.from('production_lots').insert(row)).error)
    }
  })
}

export async function regenLotToken(id: string): Promise<ActionResult> {
  return withAdmin(async (sb) => {
    check((await sb.from('production_lots').update({ trace_token: randomUUID(), updated_at: nowIso() }).eq('id', id)).error)
  })
}

export async function deleteLot(id: string): Promise<ActionResult> {
  return withAdmin(async (sb) => {
    check((await sb.from('production_lots').delete().eq('id', id)).error)
  })
}

// ===========================================================================
// 9. Agente IA (agent_config_versions)
// ===========================================================================

/** Save a new agent config version and make it the active one (live on next request). */
export async function saveAgentConfig(input: {
  persona: string
  order_rules: string
  sop_policies: string
  limits: string
  model: string
  temperature: number
  note: string | null
}): Promise<ActionResult> {
  return withAdmin(async (sb) => {
    if (!input.persona.trim()) throw new Error('La persona/tono no puede estar vacía.')
    if (!AGENT_MODEL_OPTIONS.includes(input.model)) throw new Error('Modelo no válido.')
    const temp = Number(input.temperature)
    if (!Number.isFinite(temp) || temp < AGENT_TEMPERATURE.min || temp > AGENT_TEMPERATURE.max) {
      throw new Error(`La temperatura debe estar entre ${AGENT_TEMPERATURE.min} y ${AGENT_TEMPERATURE.max}.`)
    }
    check(
      (
        await sb.rpc('save_agent_config', {
          p_persona: input.persona,
          p_order_rules: input.order_rules,
          p_sop_policies: input.sop_policies,
          p_limits: input.limits,
          p_model: input.model,
          p_temperature: temp,
          p_note: input.note?.trim() || undefined,
        })
      ).error,
    )
  })
}

/** Roll back to a previously-saved version (makes it the active one). */
export async function activateAgentConfigVersion(id: string): Promise<ActionResult> {
  return withAdmin(async (sb) => {
    if (!id) throw new Error('Versión no válida.')
    check((await sb.rpc('activate_agent_config_version', { p_id: id })).error)
  })
}
