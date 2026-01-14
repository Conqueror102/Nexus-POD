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
    // Widen window to 15 minutes to be more resilient to cron timing
    const fifteenMinutesAgo = new Date(now.getTime() - 15 * 60 * 1000)
    const fifteenMinutesFromNow = new Date(now.getTime() + 15 * 60 * 1000)


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
          status,
          projects (
            name,
            pods (
              id,
              founder_id
            )
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
      const task = reminder.tasks as any
      if (!task || task.status === 'completed') {
        // Mark as sent if task is completed
        await supabase.from('task_reminders').update({ sent: true }).eq('id', reminder.id)
        continue
      }

      const pod = task.projects?.pods
      const recipients = new Set<string>()

      // Add assignee
      if (task.assigned_to) {
        const { data: assignee } = await supabase.from('profiles').select('email, notification_email').eq('id', task.assigned_to).single()
        if (assignee?.notification_email && assignee.email) recipients.add(assignee.email)
      }

      // Add founder
      if (pod?.founder_id) {
        const { data: founder } = await supabase.from('profiles').select('email, notification_email').eq('id', pod.founder_id).single()
        if (founder?.notification_email && founder.email) recipients.add(founder.email)
      }

      if (recipients.size > 0) {
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

        for (const email of Array.from(recipients)) {
          await sendEmail({
            to: email,
            subject: emailContent.subject,
            html: emailContent.html,
          })
        }

        await supabase.from('task_reminders').update({ sent: true }).eq('id', reminder.id)

        // Internal notifications
        if (task.assigned_to) {
          await supabase.from('notifications').insert({
            user_id: task.assigned_to,
            type: 'task_due_reminder',
            title: `Task Due in ${reminder.hours_before}h`,
            message: `${task.name} is due ${reminder.hours_before <= 1 ? 'in 1 hour' : `in ${reminder.hours_before} hours`}`,
            link: `/dashboard`,
          })
        }
        if (pod?.founder_id && pod.founder_id !== task.assigned_to) {
          await supabase.from('notifications').insert({
            user_id: pod.founder_id,
            type: 'task_due_reminder',
            title: `Task Due in ${reminder.hours_before}h`,
            message: `${task.name} is due ${reminder.hours_before <= 1 ? 'in 1 hour' : `in ${reminder.hours_before} hours`}`,
            link: `/dashboard`,
          })
        }

        sentCount++
      } else {
        await supabase.from('task_reminders').update({ sent: true }).eq('id', reminder.id)
      }
    }


  return NextResponse.json({ 
    success: true, 
    message: `Sent ${sentCount} reminder emails`,
    processed: reminders?.length || 0
  })
}
