import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { randomBytes } from 'crypto'

export async function POST(
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
    return NextResponse.json({ error: 'Only founders can create invites' }, { status: 403 })
  }

  const invite_code = randomBytes(16).toString('hex')
  const expires_at = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

  const { data: invite, error } = await supabase
    .from('pod_invites')
    .insert({
      pod_id: id,
      invite_code,
      created_by: user.id,
      expires_at,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: 'Failed to create invite' }, { status: 500 })
  }

  return NextResponse.json(invite)
}

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

  if (!membership || membership.role !== 'founder') {
    return NextResponse.json({ error: 'Only founders can view invites' }, { status: 403 })
  }

  const { data: invites, error } = await supabase
    .from('pod_invites')
    .select('*')
    .eq('pod_id', id)
    .is('used_at', null)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch invites' }, { status: 500 })
  }

  return NextResponse.json(invites)
}
