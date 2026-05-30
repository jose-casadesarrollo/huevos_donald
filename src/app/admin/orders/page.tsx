import { OrdersPage } from '@/dashboard/views/orders-page'
import { getDeliveriesForTable } from '@/lib/metrics/queries'

export default async function Page() {
  const deliveries = await getDeliveriesForTable()

  return <OrdersPage deliveries={deliveries} />
}
