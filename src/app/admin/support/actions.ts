'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth/roles'
import type { ActionResult, Enums } from '@/lib/admin/config/types'

const PATH = '/admin/support'

function message(e: unknown): string {
  return e instanceof Error ? e.message : 'Error desconocido'
}

export async function updateIncident(input: {
  id: string
  status: Enums['incident_status']
  resolution: Enums['incident_resolution'] | null
  note: string | null
  within_window: boolean | null
}): Promise<ActionResult> {
  const user = await requireAdmin()
  const supabase = await createClient()
  try {
    const resolved = input.status === 'resolved' || input.status === 'rejected'
    const { error } = await supabase
      .from('incidents')
      .update({
        status: input.status,
        resolution: input.resolution,
        note: input.note,
        within_window: input.within_window,
        resolved_at: resolved ? new Date().toISOString() : null,
        resolved_by: resolved ? user.id : null,
        updated_at: new Date().toISOString(), // no trigger on incidents — set manually
      })
      .eq('id', input.id)
    if (error) throw new Error(error.message)
    revalidatePath(PATH)
    return { ok: true }
  } catch (e) {
    return { ok: false, error: message(e) }
  }
}

/** On-demand signed URLs for an incident's private evidence photos. */
export async function getIncidentPhotos(incidentId: string): Promise<{ ok: boolean; urls: string[]; error?: string }> {
  await requireAdmin()
  const supabase = await createClient()
  try {
    const { data, error } = await supabase.from('incident_photos').select('storage_path').eq('incident_id', incidentId)
    if (error) throw new Error(error.message)
    const urls: string[] = []
    for (const row of data ?? []) {
      const signed = await supabase.storage.from('incident-evidence').createSignedUrl(row.storage_path, 60 * 10)
      if (signed.data?.signedUrl) urls.push(signed.data.signedUrl)
    }
    return { ok: true, urls }
  } catch (e) {
    return { ok: false, urls: [], error: message(e) }
  }
}
