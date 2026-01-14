import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { createOrGetPlan, initializeTransaction, LITE_PLAN } from '@/lib/paystack'

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

  const { data: existingSubscription } = await supabase
    .from('pod_subscriptions')
    .select('*')
    .eq('pod_id', pod_id)
    .eq('status', 'active')
    .single()

  if (existingSubscription) {
    return NextResponse.json(
      { error: 'Pod already has an active subscription' },
      { status: 400 }
    )
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('email, display_name')
    .eq('id', user.id)
    .single()

  const email = profile?.email || user.email!

  try {
    const plan = await createOrGetPlan()

    const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL
    const callbackUrl = `${origin}/api/subscriptions/verify?pod_id=${pod_id}`

    const transaction = await initializeTransaction(
      email,
      plan.plan_code,
      {
        pod_id,
        user_id: user.id,
        plan_name: 'lite',
      },
      callbackUrl
    )

    const { error: upsertError } = await supabase.from('pod_subscriptions').upsert(
      {
        pod_id,
        plan_code: plan.plan_code,
        plan_name: 'lite',
        status: 'pending',
        member_limit: LITE_PLAN.member_limit,
        storage_limit_bytes: LITE_PLAN.storage_gb * 1024 * 1024 * 1024,
        features: {
          basic_features: true,
          premium_automations: false,
        },
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'pod_id' }
    )

    if (upsertError) {
      console.error('Subscription upsert error:', upsertError)
    }

    return NextResponse.json({
      authorization_url: transaction.authorization_url,
      reference: transaction.reference,
    })
  } catch (error) {
    console.error('Checkout error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Checkout failed' },
      { status: 500 }
    )
  }
}
