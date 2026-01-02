import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { id } = await params
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: membership } = await supabase
    .from('pod_members')
    .select('role')
    .eq('pod_id', id)
    .eq('user_id', user.id)
    .single()

  if (!membership) {
    return NextResponse.json({ error: 'Not a member of this pod' }, { status: 403 })
  }

  const { data: pod, error } = await supabase
    .from('pods')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    return NextResponse.json({ error: 'Pod not found' }, { status: 404 })
  }

  const { count: memberCount } = await supabase
    .from('pod_members')
    .select('*', { count: 'exact', head: true })
    .eq('pod_id', id)

  return NextResponse.json({ ...pod, role: membership.role, member_count: memberCount })
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { id } = await params
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: membership } = await supabase
    .from('pod_members')
    .select('role')
    .eq('pod_id', id)
    .eq('user_id', user.id)
    .single()

  if (!membership || membership.role !== 'founder') {
    return NextResponse.json({ error: 'Only founders can edit pod' }, { status: 403 })
  }

  const body = await request.json()
  const { title, summary, avatar_url } = body

  const { data: pod, error } = await supabase
    .from('pods')
    .update({ title, summary, avatar_url, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: 'Failed to update pod' }, { status: 500 })
  }

  return NextResponse.json(pod)
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { id } = await params
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: membership } = await supabase
    .from('pod_members')
    .select('role')
    .eq('pod_id', id)
    .eq('user_id', user.id)
    .single()

  if (!membership || membership.role !== 'founder') {
    return NextResponse.json({ error: 'Only founders can delete pod' }, { status: 403 })
  }

  const { error } = await supabase
    .from('pods')
    .delete()
    .eq('id', id)

  if (error) {
    return NextResponse.json({ error: 'Failed to delete pod' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
