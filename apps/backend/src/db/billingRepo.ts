import { PLANS, isPlanId, type PlanId } from '../plans.js'
import { pool } from './pool.js'

export interface Account {
  id: string
  plan: PlanId
  stripeCustomerId: string | null
  stripeSubscriptionId: string | null
}

interface AccountRow {
  id: string
  plan: string
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
}

const toAccount = (row: AccountRow): Account => ({
  id: row.id,
  plan: isPlanId(row.plan) ? row.plan : 'free',
  stripeCustomerId: row.stripe_customer_id,
  stripeSubscriptionId: row.stripe_subscription_id,
})

const COLUMNS = 'id, plan, stripe_customer_id, stripe_subscription_id'

export async function getAccount(userId: string): Promise<Account | null> {
  const result = await pool.query<AccountRow>(`SELECT ${COLUMNS} FROM users WHERE id = $1`, [userId])
  return result.rows[0] ? toAccount(result.rows[0]) : null
}

/** Billing belongs to the project's owner, so quotas follow the owner's plan. */
export async function getProjectOwnerAccount(projectId: string): Promise<Account | null> {
  const result = await pool.query<AccountRow>(
    `SELECT u.id, u.plan, u.stripe_customer_id, u.stripe_subscription_id
     FROM project_members m JOIN users u ON u.id = m.user_id
     WHERE m.project_id = $1 AND m.role = 'owner' LIMIT 1`,
    [projectId],
  )
  return result.rows[0] ? toAccount(result.rows[0]) : null
}

export async function findAccountByStripeCustomer(customerId: string): Promise<Account | null> {
  const result = await pool.query<AccountRow>(`SELECT ${COLUMNS} FROM users WHERE stripe_customer_id = $1`, [
    customerId,
  ])
  return result.rows[0] ? toAccount(result.rows[0]) : null
}

export async function setStripeCustomer(userId: string, customerId: string): Promise<void> {
  await pool.query('UPDATE users SET stripe_customer_id = $2 WHERE id = $1', [userId, customerId])
}

export async function setSubscription(
  userId: string,
  plan: PlanId,
  subscriptionId: string | null,
): Promise<void> {
  await pool.query('UPDATE users SET plan = $2, stripe_subscription_id = $3 WHERE id = $1', [
    userId,
    plan,
    subscriptionId,
  ])
}

export async function countOwnedProjects(userId: string): Promise<number> {
  const result = await pool.query<{ n: string }>(
    "SELECT COUNT(*) AS n FROM project_members WHERE user_id = $1 AND role = 'owner'",
    [userId],
  )
  return Number(result.rows[0].n)
}

export async function getMonthlyUsage(userId: string): Promise<number> {
  const result = await pool.query<{ event_count: number }>(
    `SELECT event_count FROM usage_monthly
     WHERE user_id = $1 AND month = date_trunc('month', now() AT TIME ZONE 'utc')::date`,
    [userId],
  )
  return result.rows[0]?.event_count ?? 0
}

/**
 * Atomically add `count` events to this month's total, but only if the result
 * stays within the plan's quota. Returns false (and changes nothing) otherwise,
 * so concurrent requests can't overshoot the limit.
 */
export async function reserveEvents(userId: string, plan: PlanId, count: number): Promise<boolean> {
  const limit = PLANS[plan].eventsPerMonth
  const result = await pool.query(
    `INSERT INTO usage_monthly (user_id, month, event_count)
     SELECT $1, date_trunc('month', now() AT TIME ZONE 'utc')::date, $2::int WHERE $2::int <= $3::int
     ON CONFLICT (user_id, month)
     DO UPDATE SET event_count = usage_monthly.event_count + $2::int
     WHERE usage_monthly.event_count + $2::int <= $3::int
     RETURNING event_count`,
    [userId, count, limit],
  )
  return (result.rowCount ?? 0) > 0
}
