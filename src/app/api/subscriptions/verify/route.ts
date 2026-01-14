import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { verifyTransaction, LITE_PLAN } from '@/lib/paystack'

export async function GET(request: Request) {
  const supabase = await createClient()
  const { searchParams } = new URL(request.url)
  const reference = searchParams.get('reference')
  const podId = searchParams.get('pod_id')
  const trxref = searchParams.get('trxref')

  const ref = reference || trxref

  if (!ref) {
    return NextResponse.redirect(
      new URL('/dashboard?subscription=error&message=Missing+reference', request.url)
    )
  }

  if (!podId) {
    return NextResponse.redirect(
      new URL('/dashboard?subscription=error&message=Missing+pod+ID', request.url)
    )
  }

  try {
    const transaction = await verifyTransaction(ref)

    if (transaction.status !== 'success') {
      return NextResponse.redirect(
        new URL(
          `/dashboard?subscription=failed&message=Payment+was+not+successful`,
          request.url
        )
      )
    }

    const now = new Date()
    const periodEnd = new Date(now)
    periodEnd.setMonth(periodEnd.getMonth() + 1)

    const subscriptionCode = transaction.subscription?.subscription_code || null
    const emailToken = transaction.subscription?.email_token || null
    const customerCode = transaction.customer?.customer_code || null

    const { error: updateError } = await supabase
      .from('pod_subscriptions')
      .upsert(
        {
          pod_id: podId,
          plan_code: transaction.plan_object?.plan_code || LITE_PLAN.code,
          plan_name: 'lite',
          paystack_subscription_code: subscriptionCode,
          paystack_customer_code: customerCode,
          paystack_email_token: emailToken,
          status: 'active',
          member_limit: LITE_PLAN.member_limit,
          storage_limit_bytes: LITE_PLAN.storage_gb * 1024 * 1024 * 1024,
          features: {
            basic_features: true,
            premium_automations: false,
          },
          current_period_start: now.toISOString(),
          current_period_end: periodEnd.toISOString(),
          updated_at: now.toISOString(),
        },
        { onConflict: 'pod_id' }
      )

    if (updateError) {
      console.error('Subscription update error:', updateError)
      return NextResponse.redirect(
        new URL(
          `/dashboard?subscription=error&message=Failed+to+activate+subscription`,
          request.url
        )
      )
    }

    return NextResponse.redirect(
      new URL('/dashboard?subscription=success', request.url)
    )
  } catch (error) {
    console.error('Verification error:', error)
    return NextResponse.redirect(
      new URL(
        `/dashboard?subscription=error&message=${encodeURIComponent(
          error instanceof Error ? error.message : 'Verification failed'
        )}`,
        request.url
      )
    )
  }
}
