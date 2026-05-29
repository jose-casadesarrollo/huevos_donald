import 'server-only'
import type { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'

export type DisplayUser = {
  name: string
  email: string
  avatarUrl?: string
}

/**
 * Resolve the display identity for the signed-in user: name + email from the
 * `profiles` row (falling back to auth metadata / email), and an avatar URL
 * from OAuth metadata when present (profiles has no avatar column).
 */
export async function getDisplayUser(user: User): Promise<DisplayUser> {
  const supabase = await createClient()
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, email')
    .eq('id', user.id)
    .maybeSingle()

  const meta = (user.user_metadata ?? {}) as Record<string, unknown>
  const email = profile?.email ?? user.email ?? ''
  const metaName =
    typeof meta.full_name === 'string'
      ? meta.full_name
      : typeof meta.name === 'string'
        ? meta.name
        : undefined
  const name = profile?.full_name ?? metaName ?? (email ? email.split('@')[0] : 'Usuario')
  const avatarUrl =
    typeof meta.avatar_url === 'string'
      ? meta.avatar_url
      : typeof meta.picture === 'string'
        ? meta.picture
        : undefined

  return { name, email, avatarUrl }
}
