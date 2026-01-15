"use client"

import { useState, useEffect, useRef } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Loader2, Send } from "lucide-react"
import { db, type OfflineTaskComment } from "@/lib/offline-db"
import type { Profile } from "@/lib/types"
import { useOfflineSync } from "@/hooks/use-offline-sync"
import { formatDistanceToNow } from "date-fns"

interface TaskCommentsProps {
  taskId: string
  podId: string
  user: Profile | null
}

export function TaskComments({ taskId, podId, user }: TaskCommentsProps) {
  const { getOfflineComments, addCommentOffline, isOnline } = useOfflineSync()
  const [comments, setComments] = useState<OfflineTaskComment[]>([])
  const [newComment, setNewComment] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)
  const scrollRef = useRef<HTMLDivElement>(null)
  const hasFetchedFromServer = useRef(false)

  useEffect(() => {
    // Reset the flag when taskId changes
    hasFetchedFromServer.current = false
    loadComments()
    
    // Poll for new comments occasionally
    const interval = setInterval(loadComments, 5000) 
    return () => clearInterval(interval)
  }, [taskId])

  // Scroll to bottom when comments change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [comments])

  async function loadComments() {
    try {
      // Try to fetch from server first when online
      if (isOnline && !hasFetchedFromServer.current) {
        try {
          const res = await fetch(`/api/tasks/${taskId}/comments`, {
            signal: AbortSignal.timeout(10000)
          })
          if (res.ok) {
            const serverComments = await res.json()
            hasFetchedFromServer.current = true
            
            // Cache comments to offline database
            const now = Date.now()
            for (const comment of serverComments) {
              await db.comments.put({
                id: comment.id,
                task_id: comment.task_id,
                user_id: comment.user_id,
                content: comment.content,
                created_at: comment.created_at,
                synced_at: now,
                updated_at: comment.updated_at ? new Date(comment.updated_at).getTime() : now,
                is_dirty: false,
                user_display_name: comment.profiles?.display_name || undefined,
                user_avatar_url: comment.profiles?.avatar_url || undefined,
              })
            }
            
            // Now load from offline DB to get consistent format
            const data = await getOfflineComments(taskId)
            setComments(data)
            setLoading(false)
            return
          }
        } catch (error) {
          console.warn('Failed to fetch comments from server, using offline data:', error)
        }
      }
      
      // Fall back to offline database
      const data = await getOfflineComments(taskId)
      setComments(data)
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit() {
    if (!newComment.trim() || !user) return
    
    setSubmitting(true)
    try {
      const added = await addCommentOffline(taskId, newComment, user)
      setComments(prev => [...prev, added])
      setNewComment("")
    } catch (error) {
      console.error("Failed to add comment", error)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col h-[400px] border rounded-md">
      <div className="p-3 border-b bg-muted/30">
        <h3 className="font-medium text-sm">Comments</h3>
      </div>
      
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-4">
          {loading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : comments.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-8">
              No comments yet. Start the conversation!
            </p>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className="flex gap-3">
                <Avatar className="w-8 h-8 mt-1">
                  <AvatarImage src={comment.user_avatar_url || undefined} />
                  <AvatarFallback className="text-xs">
                    {comment.user_display_name?.substring(0, 2).toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-baseline justify-between">
                    <span className="text-sm font-medium">
                      {comment.user_display_name || "Unknown User"}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                    </span>
                  </div>
                  <div className="mt-1 text-sm bg-muted/50 p-2 rounded-md">
                    {comment.content}
                  </div>
                  {comment.is_dirty && (
                    <span className="text-[10px] text-muted-foreground italic">Sending...</span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>

      <div className="p-3 border-t mt-auto">
        <div className="flex gap-2">
          <Textarea 
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Write a comment..."
            className="min-h-[60px] resize-none text-sm"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSubmit()
              }
            }}
          />
          <Button 
            size="icon" 
            onClick={handleSubmit} 
            disabled={submitting || !newComment.trim()}
            className="h-[60px] w-12 shrink-0"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </div>
      </div>
    </div>
  )
}
