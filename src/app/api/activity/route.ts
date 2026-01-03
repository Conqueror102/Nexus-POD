import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const pod_id = searchParams.get('pod_id')
  if (!pod_id) return NextResponse.json({ error: 'Pod ID required' }, { status: 400 })

  const { data: membership } = await supabase.from('pod_members').select('role').eq('pod_id', pod_id).eq('user_id', user.id).single()
  if (!membership) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { data } = await supabase.from('activity_logs').select(`*, profiles:user_id (id, display_name, avatar_url)`).eq('pod_id', pod_id).order('created_at', { ascending: false }).limit(50)
  return NextResponse.json(data || [])
}
