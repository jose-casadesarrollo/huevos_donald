import { ClientsPage } from '@/dashboard/views/clients-page'
import { getClientFormData, getClients } from '@/lib/admin/clients/queries'

export default async function Page() {
  const [clients, formData] = await Promise.all([
    getClients(),
    getClientFormData(),
  ])

  return <ClientsPage clients={clients} formData={formData} />
}
