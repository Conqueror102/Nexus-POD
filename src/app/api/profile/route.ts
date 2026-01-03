import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 })
  }

  return NextResponse.json(profile)
}

export async function PATCH(request: Request) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { display_name, avatar_url, notification_email, notification_push, timezone } = body

  const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (display_name !== undefined) updateData.display_name = display_name
  if (avatar_url !== undefined) updateData.avatar_url = avatar_url
  if (notification_email !== undefined) updateData.notification_email = notification_email
  if (notification_push !== undefined) updateData.notification_push = notification_push
  if (timezone !== undefined) updateData.timezone = timezone

  const { data: profile, error } = await supabase
    .from('profiles')
    .update(updateData)
    .eq('id', user.id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
  }

  return NextResponse.json(profile)
}
