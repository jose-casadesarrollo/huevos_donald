'use server'

import { revalidatePath } from 'next/cache'
import type { SupabaseClient, User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth/roles'
import type { Database } from '@/lib/supabase/database.types'
import type { ActionResult } from '@/lib/admin/config/types'
import { AGENT_MODEL_OPTIONS, AGENT_TEMPERATURE } from '@/lib/admin/config/labels'

type Client = SupabaseClient<Database>

const PATH = '/admin/agente'

function message(e: unknown): string {
  return e instanceof Error ? e.message : 'Error desconocido'
}

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
