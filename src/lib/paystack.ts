const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY!
const PAYSTACK_BASE_URL = 'https://api.paystack.co'

export const LITE_PLAN = {
  name: 'Lite Tier',
  code: process.env.PAYSTACK_LITE_PLAN_CODE || 'lite_plan',
  amount: 500000,
  interval: 'monthly' as const,
  member_limit: 10,
  storage_gb: 1,
  features: [
    'Up to 10 members',
    '1GB storage',
    'Basic features',
    'No premium automations',
  ],
}

interface PaystackResponse<T> {
  status: boolean
  message: string
  data: T
}

interface PaystackPlan {
  id: number
  name: string
  plan_code: string
  amount: number
  interval: string
  currency: string
}

interface PaystackCustomer {
  id: number
  customer_code: string
  email: string
  first_name: string | null
  last_name: string | null
}

interface PaystackSubscription {
  id: number
  subscription_code: string
  email_token: string
  customer: PaystackCustomer
  plan: PaystackPlan
  status: string
  next_payment_date: string
  created_at: string
}

interface PaystackTransaction {
  authorization_url: string
  access_code: string
  reference: string
}

async function paystackRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<PaystackResponse<T>> {
  const res = await fetch(`${PAYSTACK_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Unknown error' }))
    throw new Error(error.message || `Paystack API error: ${res.status}`)
  }

  return res.json()
}

export async function createOrGetPlan(): Promise<PaystackPlan> {
  try {
    const response = await paystackRequest<PaystackPlan[]>('/plan')
    const existingPlan = response.data.find(
      (p) => p.name === LITE_PLAN.name || p.plan_code === LITE_PLAN.code
    )
    if (existingPlan) {
      return existingPlan
    }
  } catch (error) {
    console.error('Error fetching plans:', error)
  }

  const response = await paystackRequest<PaystackPlan>('/plan', {
    method: 'POST',
    body: JSON.stringify({
      name: LITE_PLAN.name,
      amount: LITE_PLAN.amount,
      interval: LITE_PLAN.interval,
      currency: 'NGN',
    }),
  })

  return response.data
}

export async function initializeTransaction(
  email: string,
  planCode: string,
  metadata: Record<string, unknown>,
  callbackUrl: string
): Promise<PaystackTransaction> {
  const response = await paystackRequest<PaystackTransaction>(
    '/transaction/initialize',
    {
      method: 'POST',
      body: JSON.stringify({
        email,
        plan: planCode,
        callback_url: callbackUrl,
        metadata,
      }),
    }
  )

  return response.data
}

export async function verifyTransaction(reference: string) {
  const response = await paystackRequest<{
    status: string
    reference: string
    amount: number
    customer: PaystackCustomer
    authorization: {
      authorization_code: string
    }
    plan_object?: PaystackPlan
    subscription?: PaystackSubscription
  }>(`/transaction/verify/${reference}`)

  return response.data
}

export async function getSubscription(subscriptionCode: string) {
  const response = await paystackRequest<PaystackSubscription>(
    `/subscription/${subscriptionCode}`
  )
  return response.data
}

export async function enableSubscription(code: string, token: string) {
  const response = await paystackRequest<{ status: string }>(
    '/subscription/enable',
    {
      method: 'POST',
      body: JSON.stringify({ code, token }),
    }
  )
  return response.data
}

export async function disableSubscription(code: string, token: string) {
  const response = await paystackRequest<{ status: string }>(
    '/subscription/disable',
    {
      method: 'POST',
      body: JSON.stringify({ code, token }),
    }
  )
  return response.data
}

export async function createSubscription(
  customerCode: string,
  planCode: string,
  authorization: string
) {
  const response = await paystackRequest<PaystackSubscription>('/subscription', {
    method: 'POST',
    body: JSON.stringify({
      customer: customerCode,
      plan: planCode,
      authorization,
    }),
  })
  return response.data
}

export function verifyWebhookSignature(
  body: string,
  signature: string,
  secret: string
): boolean {
  const crypto = require('crypto')
  const hash = crypto.createHmac('sha512', secret).update(body).digest('hex')
  return hash === signature
}
