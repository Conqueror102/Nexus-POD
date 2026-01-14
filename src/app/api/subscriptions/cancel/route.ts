import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { disableSubscription } from '@/lib/paystack'

export async function POST(request: Request) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { pod_id } = await request.json()
  if (!pod_id) {
    return NextResponse.json({ error: 'Pod ID is required' }, { status: 400 })
  }

  const { data: membership } = await supabase
    .from('pod_members')
    .select('role')
    .eq('pod_id', pod_id)
    .eq('user_id', user.id)
    .single()

  if (!membership || membership.role !== 'founder') {
    return NextResponse.json(
      { error: 'Only the pod founder can manage subscriptions' },
      { status: 403 }
    )
  }

  const { data: subscription } = await supabase
    .from('pod_subscriptions')
    .select('*')
    .eq('pod_id', pod_id)
    .single()

  if (!subscription || subscription.status !== 'active') {
    return NextResponse.json(
      { error: 'No active subscription found' },
      { status: 400 }
    )
  }

  try {
    if (subscription.paystack_subscription_code && subscription.paystack_email_token) {
      await disableSubscription(
        subscription.paystack_subscription_code,
        subscription.paystack_email_token
      )
    }

    const { error: updateError } = await supabase
      .from('pod_subscriptions')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('pod_id', pod_id)

    if (updateError) {
      throw updateError
    }

    return NextResponse.json({ success: true, message: 'Subscription cancelled' })
  } catch (error) {
    console.error('Cancellation error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Cancellation failed' },
      { status: 500 }
    )
  }
}
