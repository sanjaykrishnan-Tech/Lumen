import { Router, type Request, type Response } from 'express'
import Stripe from 'stripe'
import { requireAuth } from '../auth/middleware.js'
import {
  countOwnedProjects,
  findAccountByStripeCustomer,
  getAccount,
  getMonthlyUsage,
  setStripeCustomer,
  setSubscription,
} from '../db/billingRepo.js'
import { PLANS } from '../plans.js'

const APP_URL = process.env.APP_URL ?? 'http://localhost:5173'
const PRO_PRICE_ID = process.env.STRIPE_PRO_PRICE_ID

// Billing is optional: self-hosters leave the keys unset and everything else works.
const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null

const notConfigured = (res: Response) => res.status(503).json({ error: 'Billing is not configured' })

export function createBillingRouter(): Router {
  const router = Router()
  router.use(requireAuth)

  // current plan, its limits, and this month's usage
  router.get('/', async (req, res) => {
    try {
      const account = await getAccount(req.user!.id)
      if (!account) {
        res.status(404).json({ error: 'Account not found' })
        return
      }
      const [eventsUsed, projectsUsed] = await Promise.all([
        getMonthlyUsage(account.id),
        countOwnedProjects(account.id),
      ])
      res.json({
        plan: account.plan,
        limits: PLANS[account.plan],
        usage: { events: eventsUsed, projects: projectsUsed },
        canUpgrade: !!stripe && !!PRO_PRICE_ID && account.plan === 'free',
        canManage: !!stripe && !!account.stripeCustomerId,
      })
    } catch (err) {
      console.error('Failed to load billing:', err)
      res.status(500).json({ error: 'Failed to load billing' })
    }
  })

  router.post('/checkout', async (req, res) => {
    if (!stripe || !PRO_PRICE_ID) return notConfigured(res)
    try {
      const account = await getAccount(req.user!.id)
      if (!account) {
        res.status(404).json({ error: 'Account not found' })
        return
      }
      if (account.plan === 'pro') {
        res.status(400).json({ error: 'Already on Pro' })
        return
      }
      const session = await stripe.checkout.sessions.create({
        mode: 'subscription',
        line_items: [{ price: PRO_PRICE_ID, quantity: 1 }],
        client_reference_id: account.id,
        ...(account.stripeCustomerId
          ? { customer: account.stripeCustomerId }
          : { customer_email: req.user!.email }),
        success_url: `${APP_URL}/settings?billing=success`,
        cancel_url: `${APP_URL}/settings?billing=cancelled`,
      })
      res.json({ url: session.url })
    } catch (err) {
      console.error('Failed to create checkout session:', err)
      res.status(500).json({ error: 'Failed to start checkout' })
    }
  })

  // Stripe's hosted page to update the card or cancel
  router.post('/portal', async (req, res) => {
    if (!stripe) return notConfigured(res)
    try {
      const account = await getAccount(req.user!.id)
      if (!account?.stripeCustomerId) {
        res.status(400).json({ error: 'No billing account yet' })
        return
      }
      const session = await stripe.billingPortal.sessions.create({
        customer: account.stripeCustomerId,
        return_url: `${APP_URL}/settings`,
      })
      res.json({ url: session.url })
    } catch (err) {
      console.error('Failed to create portal session:', err)
      res.status(500).json({ error: 'Failed to open billing portal' })
    }
  })

  return router
}

const customerId = (c: string | { id: string } | null): string | null =>
  typeof c === 'string' ? c : (c?.id ?? null)

/**
 * Stripe calls this when a subscription changes. It needs the raw request body
 * to check the signature, so index.ts mounts it with express.raw before express.json.
 */
export async function stripeWebhook(req: Request, res: Response) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET
  if (!stripe || !secret) return notConfigured(res)

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(req.body, req.get('stripe-signature') ?? '', secret)
  } catch {
    res.status(400).json({ error: 'Invalid signature' })
    return
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object
      const userId = session.client_reference_id
      const customer = customerId(session.customer)
      const subscription = customerId(session.subscription)
      if (userId && customer) {
        await setStripeCustomer(userId, customer)
        await setSubscription(userId, 'pro', subscription)
      }
    } else if (event.type === 'customer.subscription.updated' || event.type === 'customer.subscription.deleted') {
      const sub = event.data.object
      const customer = customerId(sub.customer)
      const account = customer ? await findAccountByStripeCustomer(customer) : null
      if (account) {
        const active =
          event.type === 'customer.subscription.updated' && (sub.status === 'active' || sub.status === 'trialing')
        await setSubscription(account.id, active ? 'pro' : 'free', active ? sub.id : null)
      }
    }
    res.json({ received: true })
  } catch (err) {
    console.error('Failed to handle Stripe webhook:', err)
    // a non-2xx makes Stripe retry later
    res.status(500).json({ error: 'Webhook handling failed' })
  }
}
