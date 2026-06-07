import { SettingsPage } from '@/dashboard/views/settings-page'
import { getServiceConfig } from '@/lib/admin/config/queries'

export default async function Page() {
  const data = await getServiceConfig()

  return <SettingsPage data={data} />
}
