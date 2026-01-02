import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { pod_id, name, description } = await request.json()
  if (!pod_id || !name) {
    return NextResponse.json({ error: 'Pod ID and name are required' }, { status: 400 })
  }

  const { data: membership } = await supabase
    .from('pod_members')
    .select('role')
    .eq('pod_id', pod_id)
    .eq('user_id', user.id)
    .single()

  if (!membership || membership.role !== 'founder') {
    return NextResponse.json({ error: 'Only founders can create projects' }, { status: 403 })
  }

  const { data: project, error } = await supabase
    .from('projects')
    .insert({
      pod_id,
      name,
      description,
      created_by: user.id,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: 'Failed to create project' }, { status: 500 })
  }

  return NextResponse.json(project)
}

export async function GET(request: Request) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const pod_id = searchParams.get('pod_id')

  if (!pod_id) {
    return NextResponse.json({ error: 'Pod ID is required' }, { status: 400 })
  }

  const { data: membership } = await supabase
    .from('pod_members')
    .select('role')
    .eq('pod_id', pod_id)
    .eq('user_id', user.id)
    .single()

  if (!membership) {
    return NextResponse.json({ error: 'Not a member of this pod' }, { status: 403 })
  }

  const { data: projects, error } = await supabase
    .from('projects')
    .select('*')
    .eq('pod_id', pod_id)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 })
  }

  return NextResponse.json(projects)
}
