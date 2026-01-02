import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

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

  const { content } = await request.json()
  if (!content || !content.trim()) {
    return NextResponse.json({ error: 'Comment content is required' }, { status: 400 })
  }

  const { data: task } = await supabase
    .from('tasks')
    .select(`
      projects (
        pod_id
      )
    `)
    .eq('id', id)
    .single()

  if (!task) {
    return NextResponse.json({ error: 'Task not found' }, { status: 404 })
  }

  const podId = (task.projects as { pod_id: string })?.pod_id
  const { data: membership } = await supabase
    .from('pod_members')
    .select('role')
    .eq('pod_id', podId)
    .eq('user_id', user.id)
    .single()

  if (!membership) {
    return NextResponse.json({ error: 'Not a member of this pod' }, { status: 403 })
  }

  const { data: comment, error } = await supabase
    .from('task_comments')
    .insert({
      task_id: id,
      user_id: user.id,
      content: content.trim(),
    })
    .select(`
      *,
      profiles:user_id (
        id,
        display_name,
        email,
        avatar_url
      )
    `)
    .single()

  if (error) {
    return NextResponse.json({ error: 'Failed to create comment' }, { status: 500 })
  }

  return NextResponse.json(comment)
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

  const { data: task } = await supabase
    .from('tasks')
    .select(`
      projects (
        pod_id
      )
    `)
    .eq('id', id)
    .single()

  if (!task) {
    return NextResponse.json({ error: 'Task not found' }, { status: 404 })
  }

  const podId = (task.projects as { pod_id: string })?.pod_id
  const { data: membership } = await supabase
    .from('pod_members')
    .select('role')
    .eq('pod_id', podId)
    .eq('user_id', user.id)
    .single()

  if (!membership) {
    return NextResponse.json({ error: 'Not a member of this pod' }, { status: 403 })
  }

  const { data: comments, error } = await supabase
    .from('task_comments')
    .select(`
      *,
      profiles:user_id (
        id,
        display_name,
        email,
        avatar_url
      )
    `)
    .eq('task_id', id)
    .order('created_at', { ascending: true })

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 })
  }

  return NextResponse.json(comments)
}
