import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { project_id, name, description, due_date, assigned_to } = await request.json()
  if (!project_id || !name || !description || !due_date) {
    return NextResponse.json({ error: 'Project ID, name, description and due date are required' }, { status: 400 })
  }

  const { data: project } = await supabase
    .from('projects')
    .select('pod_id')
    .eq('id', project_id)
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
    return NextResponse.json({ error: 'Only founders can create tasks' }, { status: 403 })
  }

  const { data: task, error } = await supabase
    .from('tasks')
    .insert({
      project_id,
      name,
      description,
      due_date,
      assigned_to,
      created_by: user.id,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: 'Failed to create task' }, { status: 500 })
  }

  const reminderHours = [24, 12, 6, 1]
  const dueDate = new Date(due_date)
  
  for (const hours of reminderHours) {
    const reminderTime = new Date(dueDate.getTime() - hours * 60 * 60 * 1000)
    if (reminderTime > new Date()) {
      await supabase.from('task_reminders').insert({
        task_id: task.id,
        reminder_time: reminderTime.toISOString(),
        hours_before: hours,
      })
    }
  }

  return NextResponse.json(task)
}

export async function GET(request: Request) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const project_id = searchParams.get('project_id')
  const pod_id = searchParams.get('pod_id')
  const assigned_to_me = searchParams.get('assigned_to_me')

  if (assigned_to_me === 'true') {
    const { data: tasks, error } = await supabase
      .from('tasks')
      .select(`
        *,
        projects (
          id,
          name,
          pod_id
        )
      `)
      .eq('assigned_to', user.id)
      .order('due_date', { ascending: true })

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 })
    }

    return NextResponse.json(tasks)
  }

  if (project_id) {
    const { data: project } = await supabase
      .from('projects')
      .select('pod_id')
      .eq('id', project_id)
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

    if (!membership) {
      return NextResponse.json({ error: 'Not a member of this pod' }, { status: 403 })
    }

    const { data: tasks, error } = await supabase
      .from('tasks')
      .select(`
        *,
        profiles:assigned_to (
          id,
          display_name,
          email,
          avatar_url
        )
      `)
      .eq('project_id', project_id)
      .order('due_date', { ascending: true })

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 })
    }

    return NextResponse.json(tasks)
  }

  if (pod_id) {
    const { data: membership } = await supabase
      .from('pod_members')
      .select('role')
      .eq('pod_id', pod_id)
      .eq('user_id', user.id)
      .single()

    if (!membership) {
      return NextResponse.json({ error: 'Not a member of this pod' }, { status: 403 })
    }

    const { data: projects } = await supabase
      .from('projects')
      .select('id')
      .eq('pod_id', pod_id)

    if (!projects || projects.length === 0) {
      return NextResponse.json([])
    }

    const projectIds = projects.map(p => p.id)

    const { data: tasks, error } = await supabase
      .from('tasks')
      .select(`
        *,
        projects (
          id,
          name
        ),
        profiles:assigned_to (
          id,
          display_name,
          email,
          avatar_url
        )
      `)
      .in('project_id', projectIds)
      .order('due_date', { ascending: true })

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 })
    }

    return NextResponse.json(tasks)
  }

  return NextResponse.json({ error: 'Project ID or Pod ID is required' }, { status: 400 })
}
