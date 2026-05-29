import type { ReactNode } from 'react'
import { requireAdmin } from '@/lib/auth/roles'
import { getDisplayUser } from '@/lib/auth/profile'
import { AppShell } from '@/dashboard/components/app-shell'

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const user = await requireAdmin()
  const displayUser = await getDisplayUser(user)

  return (
    <AppShell basePath="/admin" user={displayUser}>
      {children}
    </AppShell>
  )
}
