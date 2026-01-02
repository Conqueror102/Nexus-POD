import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { title, summary } = await request.json()
  if (!title) {
    return NextResponse.json({ error: 'Title is required' }, { status: 400 })
  }

  const { data: sequence } = await supabase.rpc('nextval', { seq_name: 'npn_sequence' })
  const npn = `NP-${String(sequence || Math.floor(Math.random() * 100000)).padStart(5, '0')}`

  const { data: pod, error: podError } = await supabase
    .from('pods')
    .insert({
      npn,
      title,
      summary,
      founder_id: user.id,
    })
    .select()
    .single()

  if (podError) {
    console.error('Pod creation error:', podError)
    return NextResponse.json({ error: 'Failed to create pod' }, { status: 500 })
  }

  const { error: memberError } = await supabase
    .from('pod_members')
    .insert({
      pod_id: pod.id,
      user_id: user.id,
      role: 'founder',
    })

  if (memberError) {
    console.error('Member creation error:', memberError)
  }

  return NextResponse.json(pod)
}

export async function GET() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: memberships, error } = await supabase
    .from('pod_members')
    .select(`
      role,
      pods (*)
    `)
    .eq('user_id', user.id)

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch pods' }, { status: 500 })
  }

  const pods = memberships?.map((m) => ({
    ...(m.pods as Record<string, unknown>),
    role: m.role,
  })) || []

  return NextResponse.json(pods)
}
