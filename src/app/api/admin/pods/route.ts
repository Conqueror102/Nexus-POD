import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()

  // Verify admin
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const { data: pods, error } = await supabase
      .from('pods')
      .select(`
        *,
        founder:profiles!pods_founder_id_fkey(email, display_name),
        members:pod_members(count),
        subscription:pod_subscriptions(plan_name, status)
      `)
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({ pods })
  } catch (error) {
    console.error('Admin pods fetch error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  const supabase = await createClient()

  // Verify admin
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const { podId } = await req.json()
    if (!podId) return NextResponse.json({ error: 'Pod ID required' }, { status: 400 })

    const { error } = await supabase
      .from('pods')
      .delete()
      .eq('id', podId)

    if (error) throw error

    return NextResponse.json({ message: 'Pod deleted successfully' })
  } catch (error) {
    console.error('Admin pod delete error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
