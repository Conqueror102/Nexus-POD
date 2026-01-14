import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const updates = await request.json()
  const { updated_at: incoming_updated_at } = updates

  // Get task with pod founder info
  const { data: task, error: taskError } = await supabase
    .from("tasks")
    .select("*, projects(pod_id, pods(founder_id))")
    .eq("id", params.id)
    .single()

  if (taskError || !task) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 })
  }

  // Conflict Resolution: Latest Timestamp Wins
  if (incoming_updated_at && task.updated_at) {
    const dbTime = new Date(task.updated_at).getTime()
    if (incoming_updated_at < dbTime) {
      return NextResponse.json(task)
    }
  }

  // @ts-ignore
  const isFounder = task.projects.pods.founder_id === user.id
  const isAssignee = task.assigned_to === user.id

  // Rule: Founder can update any task, Assignee can update only their tasks
  if (!isFounder && !isAssignee) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
  }

  // If not founder, only status can be updated
  const finalUpdates = isFounder ? updates : { status: updates.status }
  delete finalUpdates.updated_at // Remove from object to avoid manual conflict

  const { data, error } = await supabase
    .from("tasks")
    .update({ 
      ...finalUpdates, 
      updated_at: incoming_updated_at ? new Date(incoming_updated_at).toISOString() : new Date().toISOString() 
    })
    .eq("id", params.id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Reschedule reminders if due_date changed
  if (isFounder && updates.due_date && updates.due_date !== task.due_date) {
    // Delete old pending reminders
    await supabase.from('task_reminders').delete().eq('task_id', params.id).eq('sent', false)
    
    // Create new reminders
    const reminderHours = [24, 12, 6, 1]
    const dueDate = new Date(updates.due_date)
    
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
  }

  // Cancel reminders if completed
  if (updates.status === 'completed') {
    await supabase.from('task_reminders').delete().eq('task_id', params.id).eq('sent', false)
  }

  return NextResponse.json(data)
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Get task with pod founder info
  const { data: task, error: taskError } = await supabase
    .from("tasks")
    .select("*, projects(pod_id, pods(founder_id))")
    .eq("id", params.id)
    .single()

  if (taskError || !task) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 })
  }

  // @ts-ignore
  const isFounder = task.projects.pods.founder_id === user.id

  if (!isFounder) {
    return NextResponse.json({ error: "Only the founder can delete tasks" }, { status: 403 })
  }

  const { error } = await supabase
    .from("tasks")
    .delete()
    .eq("id", params.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
