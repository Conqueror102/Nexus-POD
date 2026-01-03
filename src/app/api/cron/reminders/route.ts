import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { sendEmail, taskReminderEmail } from '@/lib/email'

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = await createClient()
  
  const now = new Date()
  const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000)
  const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000)

  const { data: reminders, error } = await supabase
    .from('task_reminders')
    .select(`
      id,
      hours_before,
      tasks (
        id,
        name,
        due_date,
        assigned_to,
        projects (
          name
        )
      )
    `)
    .eq('sent', false)
    .gte('reminder_time', fiveMinutesAgo.toISOString())
    .lte('reminder_time', fiveMinutesFromNow.toISOString())

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch reminders' }, { status: 500 })
  }

  let sentCount = 0

  for (const reminder of reminders || []) {
    const task = reminder.tasks as { 
      id: string
      name: string
      due_date: string
      assigned_to: string | null
      projects: { name: string } | null
    }

    if (!task || !task.assigned_to) continue

    const { data: assignee } = await supabase
      .from('profiles')
      .select('email, notification_email')
      .eq('id', task.assigned_to)
      .single()

    if (assignee?.notification_email && assignee.email) {
      const dueDate = new Date(task.due_date)
      const emailContent = taskReminderEmail(
        task.name,
        task.projects?.name || 'Unknown Project',
        dueDate.toLocaleString('en-NG', { 
          dateStyle: 'medium', 
          timeStyle: 'short',
          timeZone: 'Africa/Lagos'
        }),
        reminder.hours_before
      )

      const result = await sendEmail({
        to: assignee.email,
        subject: emailContent.subject,
        html: emailContent.html,
      })

      if (result.success) {
        await supabase
          .from('task_reminders')
          .update({ sent: true })
          .eq('id', reminder.id)

        await supabase.from('notifications').insert({
          user_id: task.assigned_to,
          type: 'task_due_reminder',
          title: `Task Due in ${reminder.hours_before}h`,
          message: `${task.name} is due ${reminder.hours_before <= 1 ? 'in 1 hour' : `in ${reminder.hours_before} hours`}`,
          link: `/dashboard`,
        })

        sentCount++
      }
    } else {
      await supabase
        .from('task_reminders')
        .update({ sent: true })
        .eq('id', reminder.id)
    }
  }

  return NextResponse.json({ 
    success: true, 
    message: `Sent ${sentCount} reminder emails`,
    processed: reminders?.length || 0
  })
}
