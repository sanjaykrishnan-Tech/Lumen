export type PlanId = 'free' | 'pro'

export interface Plan {
  label: string
  /** events per calendar month, across all of the account's projects */
  eventsPerMonth: number
  /** projects the account may own */
  projects: number
  /** how far back the dashboard can read */
  historyDays: number
}

// A larger "team" plan is on hold until ingestion load has been measured.
export const PLANS: Record<PlanId, Plan> = {
  free: { label: 'Free', eventsPerMonth: 10_000, projects: 1, historyDays: 30 },
  pro: { label: 'Pro', eventsPerMonth: 100_000, projects: 5, historyDays: 180 },
}

export const isPlanId = (value: string): value is PlanId => value in PLANS
