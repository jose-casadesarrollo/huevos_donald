import type {NewSubsPoint, Overview, RevenuePoint} from "@/lib/metrics/types";

import {DashboardToolbar} from "../widgets/dashboard-toolbar";
import {EmployeesTable} from "../widgets/employees-table";
import {KpiRow} from "../widgets/kpi-row";
import {NewSubscriptionsCard} from "../widgets/new-subscriptions-card";
import {RevenueByDayCard} from "../widgets/revenue-by-day-card";

interface DashboardPageProps {
  overview: Overview;
  revenue: RevenuePoint[];
  newSubs: NewSubsPoint[];
}

export function DashboardPage({newSubs, overview, revenue}: DashboardPageProps) {
  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 pb-10 pt-4">
      <DashboardToolbar />
      <KpiRow overview={overview} />
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <RevenueByDayCard data={revenue} />
        <NewSubscriptionsCard data={newSubs} />
      </div>
      <EmployeesTable />
    </div>
  );
}
