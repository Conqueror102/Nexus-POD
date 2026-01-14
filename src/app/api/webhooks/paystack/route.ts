import { NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { verifyWebhookSignature, LITE_PLAN } from '@/lib/paystack'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY!

export async function POST(request: Request) {
  const body = await request.text()
  const signature = request.headers.get('x-paystack-signature')

  if (!signature) {
    console.error('Missing Paystack signature')
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
  }

  if (!verifyWebhookSignature(body, signature, paystackSecretKey)) {
    console.error('Invalid Paystack signature')
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  const supabase = createServiceClient(supabaseUrl, supabaseServiceKey)

  let event: {
    event: string
    data: {
      id?: number
      status?: string
      subscription_code?: string
      email_token?: string
      customer?: {
        id: number
        customer_code: string
        email: string
      }
      plan?: {
        id: number
        plan_code: string
        name: string
        amount: number
        interval: string
      }
      metadata?: {
        pod_id?: string
        user_id?: string
        plan_name?: string
      }
      authorization?: {
        authorization_code: string
      }
      next_payment_date?: string
      reference?: string
      amount?: number
    }
  }

  try {
    event = JSON.parse(body)
  } catch (error) {
    console.error('Failed to parse webhook body:', error)
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  console.log('Paystack webhook event:', event.event)

  const eventType = event.event
  const data = event.data

  switch (eventType) {
    case 'subscription.create': {
      const podId = data.metadata?.pod_id
      if (!podId) {
        console.error('No pod_id in subscription.create metadata')
        break
      }

      const now = new Date()
      const nextPayment = data.next_payment_date
        ? new Date(data.next_payment_date)
        : new Date(now.setMonth(now.getMonth() + 1))

      const { error } = await supabase.from('pod_subscriptions').upsert(
        {
          pod_id: podId,
          plan_code: data.plan?.plan_code || LITE_PLAN.code,
          plan_name: 'lite',
          paystack_subscription_code: data.subscription_code,
          paystack_customer_code: data.customer?.customer_code,
          paystack_email_token: data.email_token,
          status: 'active',
          member_limit: LITE_PLAN.member_limit,
          storage_limit_bytes: LITE_PLAN.storage_gb * 1024 * 1024 * 1024,
          features: {
            basic_features: true,
            premium_automations: false,
          },
          current_period_start: new Date().toISOString(),
          current_period_end: nextPayment.toISOString(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'pod_id' }
      )

      if (error) {
        console.error('Error updating subscription on create:', error)
      }
      break
    }

    case 'subscription.not_renew': {
      const subscriptionCode = data.subscription_code
      if (!subscriptionCode) {
        console.error('No subscription_code in subscription.not_renew')
        break
      }

      const { error } = await supabase
        .from('pod_subscriptions')
        .update({
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('paystack_subscription_code', subscriptionCode)

      if (error) {
        console.error('Error updating subscription on not_renew:', error)
      }
      break
    }

    case 'subscription.disable': {
      const subscriptionCode = data.subscription_code
      if (!subscriptionCode) {
        console.error('No subscription_code in subscription.disable')
        break
      }

      const { error } = await supabase
        .from('pod_subscriptions')
        .update({
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('paystack_subscription_code', subscriptionCode)

      if (error) {
        console.error('Error updating subscription on disable:', error)
      }
      break
    }

    case 'charge.success': {
      const metadata = data.metadata
      const subscriptionCode =
        (data as { subscription?: { subscription_code?: string } }).subscription
          ?.subscription_code || null

      if (subscriptionCode) {
        const now = new Date()
        const periodEnd = new Date(now)
        periodEnd.setMonth(periodEnd.getMonth() + 1)

        const { error } = await supabase
          .from('pod_subscriptions')
          .update({
            status: 'active',
            current_period_start: now.toISOString(),
            current_period_end: periodEnd.toISOString(),
            updated_at: now.toISOString(),
          })
          .eq('paystack_subscription_code', subscriptionCode)

        if (error) {
          console.error('Error updating subscription on charge.success:', error)
        }
      } else if (metadata?.pod_id) {
        const now = new Date()
        const periodEnd = new Date(now)
        periodEnd.setMonth(periodEnd.getMonth() + 1)

        const { error } = await supabase
          .from('pod_subscriptions')
          .update({
            status: 'active',
            paystack_customer_code: data.customer?.customer_code,
            current_period_start: now.toISOString(),
            current_period_end: periodEnd.toISOString(),
            updated_at: now.toISOString(),
          })
          .eq('pod_id', metadata.pod_id)

        if (error) {
          console.error('Error updating subscription on charge.success (by pod_id):', error)
        }
      }
      break
    }

    case 'invoice.payment_failed': {
      const subscriptionCode = data.subscription_code
      if (subscriptionCode) {
        const { error } = await supabase
          .from('pod_subscriptions')
          .update({
            status: 'past_due',
            updated_at: new Date().toISOString(),
          })
          .eq('paystack_subscription_code', subscriptionCode)

        if (error) {
          console.error('Error updating subscription on payment_failed:', error)
        }
      }
      break
    }

    default:
      console.log('Unhandled event type:', eventType)
  }

  return NextResponse.json({ received: true }, { status: 200 })
}
