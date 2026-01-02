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

  const { data: task, error } = await supabase
    .from('tasks')
    .select(`
      *,
      projects (
        id,
        name,
        pod_id
      ),
      profiles:assigned_to (
        id,
        display_name,
        email,
        avatar_url
      )
    `)
    .eq('id', id)
    .single()

  if (error || !task) {
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

  return NextResponse.json({ ...task, role: membership.role })
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

  const { data: task } = await supabase
    .from('tasks')
    .select(`
      *,
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

  const body = await request.json()
  const { name, description, due_date, assigned_to, status } = body

  if (status !== undefined) {
    const isFounder = membership.role === 'founder'
    const isAssignee = task.assigned_to === user.id

    if (!isFounder && !isAssignee) {
      return NextResponse.json({ error: 'Only founders or assignees can update status' }, { status: 403 })
    }
  }

  if ((name !== undefined || description !== undefined || due_date !== undefined || assigned_to !== undefined) && membership.role !== 'founder') {
    return NextResponse.json({ error: 'Only founders can modify task details' }, { status: 403 })
  }

  const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (name !== undefined) updateData.name = name
  if (description !== undefined) updateData.description = description
  if (due_date !== undefined) updateData.due_date = due_date
  if (assigned_to !== undefined) updateData.assigned_to = assigned_to
  if (status !== undefined) updateData.status = status

  const { data: updated, error } = await supabase
    .from('tasks')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: 'Failed to update task' }, { status: 500 })
  }

  if (status === 'completed') {
    await supabase
      .from('task_reminders')
      .delete()
      .eq('task_id', id)
      .eq('sent', false)
  }

  if (due_date !== undefined && due_date !== task.due_date) {
    await supabase
      .from('task_reminders')
      .delete()
      .eq('task_id', id)
      .eq('sent', false)

    const reminderHours = [24, 12, 6, 1]
    const dueDate = new Date(due_date)
    
    for (const hours of reminderHours) {
      const reminderTime = new Date(dueDate.getTime() - hours * 60 * 60 * 1000)
      if (reminderTime > new Date()) {
        await supabase.from('task_reminders').insert({
          task_id: id,
          reminder_time: reminderTime.toISOString(),
          hours_before: hours,
        })
      }
    }
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

  if (!membership || membership.role !== 'founder') {
    return NextResponse.json({ error: 'Only founders can delete tasks' }, { status: 403 })
  }

  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', id)

  if (error) {
    return NextResponse.json({ error: 'Failed to delete task' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
