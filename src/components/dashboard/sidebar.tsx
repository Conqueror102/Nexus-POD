"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ThemeToggle } from "@/components/theme-toggle"
import { Hexagon, Plus, Bell, Settings, User, LogOut, Loader2, Menu } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import type { PodWithRole, Profile, Notification } from "@/lib/types"

interface DashboardSidebarProps {
  user: Profile | null
  pods: PodWithRole[]
  selectedPod: PodWithRole | null
  notifications: Notification[]
  onSelectPod: (pod: PodWithRole) => void
  onCreatePod: (title: string, summary: string) => Promise<void>
  onMarkNotificationRead: (id: string) => void
  onMarkAllNotificationsRead: () => void
  onSignOut: () => void
  isOpen?: boolean
  onOpenChange?: (open: boolean) => void
}

export function DashboardSidebar(props: DashboardSidebarProps) {
  const {
    user, pods, selectedPod, notifications, onSelectPod, onCreatePod,
    onMarkNotificationRead, onMarkAllNotificationsRead, onSignOut, isOpen, onOpenChange,
  } = props
  const router = useRouter()
  const [createPodOpen, setCreatePodOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [newPodTitle, setNewPodTitle] = useState("")
  const [newPodSummary, setNewPodSummary] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const unreadNotifications = notifications.filter(n => !n.is_read)

  async function handleCreatePod() {
    if (!newPodTitle.trim()) return
    setSubmitting(true)
    await onCreatePod(newPodTitle, newPodSummary)
    setCreatePodOpen(false)
    setNewPodTitle("")
    setNewPodSummary("")
    setSubmitting(false)
  }

  function handlePodSelect(pod: PodWithRole) {
    onSelectPod(pod)
    onOpenChange?.(false)
  }

  const content = (
    <>
      <div className="p-4 border-b">
        <Link href="/" className="flex items-center gap-2">
          <div className="relative">
            <Hexagon className="w-8 h-8 text-primary fill-primary/10" strokeWidth={1.5} />
            <span className="absolute inset-0 flex items-center justify-center text-primary font-bold text-xs">N</span>
          </div>
          <span className="text-lg font-semibold tracking-tight">Nexus Pod</span>
        </Link>
      </div>

      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Your Pods</span>
          <Dialog open={createPodOpen} onOpenChange={setCreatePodOpen}>
            <DialogTrigger asChild>
              <Button size="icon" variant="ghost" className="h-6 w-6">
                <Plus className="w-4 h-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Pod</DialogTitle>
                <DialogDescription>Start a new workspace for your team</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Pod Title</Label>
                  <Input value={newPodTitle} onChange={(e) => setNewPodTitle(e.target.value)} placeholder="My Awesome Project" />
                </div>
                <div className="space-y-2">
                  <Label>Summary (optional)</Label>
                  <Textarea value={newPodSummary} onChange={(e) => setNewPodSummary(e.target.value)} placeholder="Brief description..." className="resize-none" rows={3} />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleCreatePod} disabled={submitting || !newPodTitle.trim()}>
                  {submitting && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                  Create Pod
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <ScrollArea className="h-48">
          <div className="space-y-1">
            {pods.map((pod) => (
              <button key={pod.id} onClick={() => handlePodSelect(pod)} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${selectedPod?.id === pod.id ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}>
                <Avatar className="w-8 h-8">
                  <AvatarImage src={pod.avatar_url || undefined} />
                  <AvatarFallback className="text-xs bg-muted">{pod.title.substring(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{pod.title}</p>
                  <p className="text-xs text-muted-foreground">{pod.npn}</p>
                </div>
                {pod.role === "founder" && <Badge variant="secondary" className="text-[10px] bg-primary/10 text-primary border-0 hidden sm:inline-flex">Founder</Badge>}
              </button>
            ))}
            {pods.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No pods yet</p>}
          </div>
        </ScrollArea>
      </div>

      <Separator />
      <div className="flex-1" />

      <div className="p-4 border-t">
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9">
            <AvatarImage src={user?.avatar_url || undefined} />
            <AvatarFallback>{user?.display_name?.substring(0, 2).toUpperCase() || "U"}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user?.display_name}</p>
            <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
          </div>
          
          <Popover open={notificationsOpen} onOpenChange={setNotificationsOpen}>
            <PopoverTrigger asChild>
              <Button size="icon" variant="ghost" className="relative">
                <Bell className="w-4 h-4" />
                {unreadNotifications.length > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 bg-destructive text-destructive-foreground text-[10px] rounded-full flex items-center justify-center">{unreadNotifications.length > 9 ? "9+" : unreadNotifications.length}</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end">
              <div className="flex items-center justify-between p-3 border-b">
                <h4 className="font-semibold text-sm">Notifications</h4>
                {unreadNotifications.length > 0 && <Button variant="ghost" size="sm" onClick={onMarkAllNotificationsRead} className="text-xs h-auto py-1">Mark all read</Button>}
              </div>
              <ScrollArea className="h-72">
                {notifications.length > 0 ? (
                  <div className="divide-y">
                    {notifications.slice(0, 20).map((n) => (
                      <button key={n.id} onClick={() => onMarkNotificationRead(n.id)} className={`w-full p-3 text-left hover:bg-muted transition-colors ${!n.is_read ? 'bg-primary/5' : ''}`}>
                        <div className="flex gap-3">
                          <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${!n.is_read ? 'bg-primary' : 'bg-transparent'}`} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium">{n.title}</p>
                            <p className="text-xs text-muted-foreground line-clamp-2">{n.message}</p>
                            <p className="text-xs text-muted-foreground mt-1">{formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}</p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8">
                    <Bell className="w-8 h-8 text-muted-foreground/50 mb-2" />
                    <p className="text-sm text-muted-foreground">No notifications yet</p>
                  </div>
                )}
              </ScrollArea>
            </PopoverContent>
          </Popover>

          <Sheet open={settingsOpen} onOpenChange={setSettingsOpen}>
            <SheetTrigger asChild><Button size="icon" variant="ghost"><Settings className="w-4 h-4" /></Button></SheetTrigger>
            <SheetContent>
              <SheetHeader><SheetTitle>Quick Settings</SheetTitle><SheetDescription>Manage your account</SheetDescription></SheetHeader>
              <div className="py-6 space-y-6">
                <div className="space-y-4">
                  <h3 className="text-sm font-medium flex items-center gap-2"><User className="w-4 h-4" />Profile</h3>
                  <div className="flex items-center gap-4">
                    <Avatar className="h-16 w-16"><AvatarImage src={user?.avatar_url || undefined} /><AvatarFallback className="text-lg">{user?.display_name?.substring(0, 2).toUpperCase() || "U"}</AvatarFallback></Avatar>
                    <div className="flex-1"><p className="font-medium">{user?.display_name}</p><p className="text-sm text-muted-foreground">{user?.email}</p></div>
                  </div>
                  <Link href="/settings"><Button variant="outline" className="w-full"><Settings className="w-4 h-4 mr-2" />Open Full Settings</Button></Link>
                </div>
                <Separator />
                <div className="space-y-4">
                  <h3 className="text-sm font-medium">Appearance</h3>
                  <div className="flex items-center justify-between"><span className="text-sm">Theme</span><ThemeToggle /></div>
                </div>
                <Separator />
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-destructive">Danger Zone</h3>
                  <Button variant="destructive" className="w-full" onClick={() => { onSignOut(); router.push("/"); }}><LogOut className="w-4 h-4 mr-2" />Sign Out</Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </>
  )

  return (
    <>
      <aside className="hidden md:flex w-72 min-h-screen border-r bg-card/50 backdrop-blur-sm flex-col fixed left-0 top-0 z-40">{content}</aside>
      <Sheet open={isOpen} onOpenChange={onOpenChange}><SheetContent side="left" className="w-72 p-0 flex flex-col">{content}</SheetContent></Sheet>
    </>
  )
}

export function MobileMenuButton({ onClick }: { onClick: () => void }) {
  return <Button variant="ghost" size="icon" className="md:hidden" onClick={onClick}><Menu className="w-5 h-5" /></Button>
}
