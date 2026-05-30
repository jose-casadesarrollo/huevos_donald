import { DashboardPage } from '@/dashboard/views/dashboard-page'
import { getNewSubscriptionsByDay, getOverview, getRevenueByDay } from '@/lib/metrics/queries'

export default async function Page() {
  const [overview, revenue, newSubs] = await Promise.all([
    getOverview(),
    getRevenueByDay(),
    getNewSubscriptionsByDay(),
  ])

  return <DashboardPage overview={overview} revenue={revenue} newSubs={newSubs} />
}
