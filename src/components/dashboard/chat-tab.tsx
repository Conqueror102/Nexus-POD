"use client"

import { useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Send } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import type { ChatMessageWithProfile } from "./types"
import type { Profile } from "@/lib/types"

interface ChatTabProps {
  chatMessages: ChatMessageWithProfile[]
  user: Profile | null
  chatMessage: string
  onChatMessageChange: (message: string) => void
  onSendChat: () => void
}

export function ChatTab({
  chatMessages,
  user,
  chatMessage,
  onChatMessageChange,
  onSendChat,
}: ChatTabProps) {
  const chatEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [chatMessages])

  return (
    <div className="space-y-4">
      <Card className="h-[calc(100vh-280px)] flex flex-col">
        <CardHeader className="pb-3">
          <CardTitle>Pod Chat</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col min-h-0">
          <ScrollArea className="flex-1 pr-4">
            <div className="space-y-3 px-1">
                {chatMessages.map((msg) => {
                  const isOwnMessage = msg.user_id === user?.id
                  return (
                    <div 
                      key={msg.id} 
                      className={`flex gap-2 ${isOwnMessage ? "justify-end" : "justify-start"}`}
                    >
                      {!isOwnMessage && (
                        <Avatar className="h-8 w-8 flex-shrink-0">
                          <AvatarImage src={msg.profiles?.avatar_url || undefined} />
                          <AvatarFallback className="text-xs">
                            {msg.profiles?.display_name?.substring(0, 2).toUpperCase() || "U"}
                          </AvatarFallback>
                        </Avatar>
                      )}
                      <div className={`max-w-[75%] sm:max-w-[70%] ${isOwnMessage ? "items-end" : "items-start"} flex flex-col`}>
                        <div 
                          className={`rounded-2xl px-3 py-2 ${
                            isOwnMessage 
                              ? "bg-green-500 text-white rounded-br-md" 
                              : "bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-bl-md"
                          }`}
                        >
                          <p className="text-sm break-words">{msg.content}</p>
                        </div>
                        <p className={`text-[10px] text-muted-foreground mt-1 ${isOwnMessage ? "text-right" : "text-left"}`}>
                          {!isOwnMessage && <span>{msg.profiles?.display_name} · </span>}
                          {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                        </p>
                      </div>
                      {isOwnMessage && (
                        <Avatar className="h-8 w-8 flex-shrink-0">
                          <AvatarImage src={msg.profiles?.avatar_url || undefined} />
                          <AvatarFallback className="text-xs">
                            {msg.profiles?.display_name?.substring(0, 2).toUpperCase() || "U"}
                          </AvatarFallback>
                        </Avatar>
                      )}
                    </div>
                  )
                })}

              <div ref={chatEndRef} />
            </div>
          </ScrollArea>
          <div className="flex gap-2 pt-4 mt-4 border-t">
            <Input
              value={chatMessage}
              onChange={(e) => onChatMessageChange(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && onSendChat()}
              placeholder="Type a message..."
            />
            <Button onClick={onSendChat} disabled={!chatMessage.trim()}>
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
