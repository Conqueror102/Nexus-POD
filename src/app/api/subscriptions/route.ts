import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const supabase = await createClient()
  const { searchParams } = new URL(request.url)
  const podId = searchParams.get('pod_id')

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!podId) {
    return NextResponse.json({ error: 'Pod ID is required' }, { status: 400 })
  }

  const { data: membership } = await supabase
    .from('pod_members')
    .select('role')
    .eq('pod_id', podId)
    .eq('user_id', user.id)
    .single()

  if (!membership) {
    return NextResponse.json({ error: 'Not a member of this pod' }, { status: 403 })
  }

  const { data: subscription, error } = await supabase
    .from('pod_subscriptions')
    .select('*')
    .eq('pod_id', podId)
    .single()

  if (error && error.code !== 'PGRST116') {
    console.error('Subscription fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch subscription' }, { status: 500 })
  }

  return NextResponse.json(subscription || null)
}
