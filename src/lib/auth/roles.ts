import 'server-only'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { userHasAdminRole } from '@/lib/auth/rbac'
import type { Database } from '@/lib/supabase/database.types'

type AppRole = Database['public']['Enums']['app_role']

export async function getCurrentUser() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user
}

export async function getCurrentUserRoles(): Promise<AppRole[]> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return []
  const { data } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
  return (data ?? []).map((r) => r.role)
}

export async function requireUser() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  return user
}

export async function requireAdmin() {
  const user = await requireUser()
  const supabase = await createClient()
  if (!(await userHasAdminRole(supabase, user.id))) redirect('/')
  return user
}
