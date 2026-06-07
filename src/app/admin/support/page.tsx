import { SupportPage } from '@/dashboard/views/support-page'
import { getSupportData } from '@/lib/admin/support/queries'

export default async function Page() {
  const { incidents, customers } = await getSupportData()

  return <SupportPage incidents={incidents} customers={customers} />
}
