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

  const { data: project, error: projectError } = await supabase
    .from('projects')
    .select('*')
    .eq('id', id)
    .single()

  if (projectError || !project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 })
  }

  const { data: membership } = await supabase
    .from('pod_members')
    .select('role')
    .eq('pod_id', project.pod_id)
    .eq('user_id', user.id)
    .single()

  if (!membership) {
    return NextResponse.json({ error: 'Not a member of this pod' }, { status: 403 })
  }

  return NextResponse.json({ ...project, role: membership.role })
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

  const { data: project } = await supabase
    .from('projects')
    .select('pod_id')
    .eq('id', id)
    .single()

  if (!project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 })
  }

  const { data: membership } = await supabase
    .from('pod_members')
    .select('role')
    .eq('pod_id', project.pod_id)
    .eq('user_id', user.id)
    .single()

  if (!membership || membership.role !== 'founder') {
    return NextResponse.json({ error: 'Only founders can edit projects' }, { status: 403 })
  }

  const body = await request.json()
  const { name, description } = body

  const { data: updated, error } = await supabase
    .from('projects')
    .update({ name, description, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: 'Failed to update project' }, { status: 500 })
  }

  return NextResponse.json(updated)
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

  const { data: project } = await supabase
    .from('projects')
    .select('pod_id')
    .eq('id', id)
    .single()

  if (!project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 })
  }

  const { data: membership } = await supabase
    .from('pod_members')
    .select('role')
    .eq('pod_id', project.pod_id)
    .eq('user_id', user.id)
    .single()

  if (!membership || membership.role !== 'founder') {
    return NextResponse.json({ error: 'Only founders can delete projects' }, { status: 403 })
  }

  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', id)

  if (error) {
    return NextResponse.json({ error: 'Failed to delete project' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
