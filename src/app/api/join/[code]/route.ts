import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const supabase = await createClient()
  const { code } = await params

  const { data: invite, error } = await supabase
    .from('pod_invites')
    .select(`
      *,
      pods (
        id,
        title,
        npn,
        summary
      )
    `)
    .eq('invite_code', code)
    .is('used_at', null)
    .single()

  if (error || !invite) {
    return NextResponse.json({ error: 'Invalid or expired invite' }, { status: 404 })
  }

  if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
    return NextResponse.json({ error: 'Invite has expired' }, { status: 410 })
  }

  return NextResponse.json(invite)
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const supabase = await createClient()
  const { code } = await params
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: invite, error: inviteError } = await supabase
    .from('pod_invites')
    .select('*')
    .eq('invite_code', code)
    .is('used_at', null)
    .single()

  if (inviteError || !invite) {
    return NextResponse.json({ error: 'Invalid or expired invite' }, { status: 404 })
  }

  if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
    return NextResponse.json({ error: 'Invite has expired' }, { status: 410 })
  }

  const { data: existingMember } = await supabase
    .from('pod_members')
    .select('id')
    .eq('pod_id', invite.pod_id)
    .eq('user_id', user.id)
    .single()

  if (existingMember) {
    return NextResponse.json({ error: 'Already a member', pod_id: invite.pod_id }, { status: 409 })
  }

  const { error: memberError } = await supabase
    .from('pod_members')
    .insert({
      pod_id: invite.pod_id,
      user_id: user.id,
      role: 'member',
    })

  if (memberError) {
    return NextResponse.json({ error: 'Failed to join pod' }, { status: 500 })
  }

  await supabase
    .from('pod_invites')
    .update({ used_at: new Date().toISOString(), used_by: user.id })
    .eq('id', invite.id)

  return NextResponse.json({ success: true, pod_id: invite.pod_id })
}
