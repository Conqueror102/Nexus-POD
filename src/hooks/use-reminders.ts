"use client"

import { useEffect, useCallback } from "react"
import type { TaskWithAssignee } from "@/components/dashboard/types"
import type { Profile } from "@/lib/types"
import { toast } from "sonner"
import { differenceInHours, parseISO } from "date-fns"

const REMINDER_HOURS = [24, 12, 6, 1]

export function useReminders(tasks: TaskWithAssignee[], user: Profile | null) {
  
  const checkReminders = useCallback(() => {
    if (!user || !("Notification" in window)) return

    const now = new Date()

    tasks.forEach(task => {
      // Filter for relevant tasks:
      // 1. Not completed
      // 2. Assigned to me OR I am the creator (requirements say assignee and founder)
      // Note: "Founder" check would require role, but checking creator is a good proxy for now, 
      // or we rely on the component passing strict "my tasks" list. 
      // For now, we check if user is assignee or creator.
      const isAssignee = task.assigned_to === user.id
      const isCreator = task.created_by === user.id
      
      if (task.status === "completed" || (!isAssignee && !isCreator)) return

      const dueDate = new Date(task.due_date)
      const hoursUntilDue = differenceInHours(dueDate, now)

      // We only care if it's within the largest window (24h) and in the future (or slightly past but not too late)
      if (hoursUntilDue > 24 || hoursUntilDue < 0) return

      REMINDER_HOURS.forEach(hourWin => {
        // Check if we are close to this window (within last 15 mins to avoid spamming if user opens app late?)
        // Better approach: Check if we passed the threshold AND haven't notified yet.
        
        // Threshold: Due Date - hourWin (e.g. 1 hour before)
        const thresholdTime = new Date(dueDate.getTime() - hourWin * 60 * 60 * 1000)
        
        // If now is past the threshold
        if (now >= thresholdTime) {
          const storageKey = `reminder_${task.id}_${hourWin}h`
          const alreadyNotified = localStorage.getItem(storageKey)

          if (!alreadyNotified) {
            // Send notification
            const title = `Task Due Soon: ${task.name}`
            const body = `This task is due in ${hoursUntilDue < 1 ? 'less than an hour' : `about ${hourWin} hours`}.`
            
            // System Notification
            if (Notification.permission === "granted") {
              new Notification(title, { body, icon: '/icon-192x192.png' })
            }
            
            // In-app Toast
            toast.info(title, { description: body, duration: 5000 })
            
            // Mark as notified
            localStorage.setItem(storageKey, new Date().toISOString())
          }
        }
      })
    })
  }, [tasks, user])

  // Request permission on mount
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission()
    }
  }, [])

  // Check periodically
  useEffect(() => {
    checkReminders() // Check on load/tasks change
    
    const interval = setInterval(checkReminders, 60 * 1000) // Check every minute
    return () => clearInterval(interval)
  }, [checkReminders])

  return null
}
