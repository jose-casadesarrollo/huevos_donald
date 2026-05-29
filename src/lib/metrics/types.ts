/**
 * Chart-ready data shapes returned by the metrics query layer and consumed by
 * the (client) dashboard widgets. Kept free of `server-only` so client
 * components can import the types without pulling in the query module.
 */

export type Overview = {
  activeSubscriptions: number
  mrrCents: number
  revenueLast30dCents: number
  revenueMtdCents: number
  deliveriesScheduledNext7d: number
  deliveriesCompletedLast30d: number
  failedDeliveriesLast30d: number
}
