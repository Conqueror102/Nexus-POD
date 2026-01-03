"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { UserMinus } from "lucide-react"
import type { PodMemberWithProfile } from "./types"

interface MembersTabProps {
  members: PodMemberWithProfile[]
  isFounder: boolean
  onRemoveMember: (userId: string) => void
}

export function MembersTab({ members, isFounder, onRemoveMember }: MembersTabProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Team Members</CardTitle>
          <CardDescription>{members.length} members in this pod</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {members.map((member) => (
              <div key={member.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={member.profiles.avatar_url || undefined} />
                    <AvatarFallback>
                      {member.profiles.display_name?.substring(0, 2).toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">
                      {member.profiles.display_name || member.profiles.email}
                    </p>
                    <p className="text-xs text-muted-foreground">{member.profiles.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={member.role === "founder" ? "default" : "secondary"}>
                    {member.role === "founder" ? "Founder" : "Member"}
                  </Badge>
                  {isFounder && member.role !== "founder" && (
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => onRemoveMember(member.profiles.id)}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <UserMinus className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
