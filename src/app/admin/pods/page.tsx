"use client"

import { useEffect, useState } from "react"
import { 
  Box, 
  Search, 
  MoreHorizontal, 
  Trash2, 
  ExternalLink,
  Users,
  CreditCard,
  Loader2
} from "lucide-react"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { toast } from "sonner"
import { format } from "date-fns"

interface Pod {
  id: string
  title: string
  npn: string
  avatar_url: string | null
  founder: { email: string, display_name: string | null }
  members: [{ count: number }]
  subscription: [{ plan_name: string, status: string }]
  created_at: string
}

export default function AdminPods() {
  const [pods, setPods] = useState<Pod[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [deletingPodId, setDeletingPodId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    fetchPods()
  }, [])

  async function fetchPods() {
    try {
      const res = await fetch('/api/admin/pods')
      const data = await res.json()
      setPods(data.pods)
    } catch (error) {
      console.error('Failed to fetch pods:', error)
      toast.error("Failed to load pods")
    } finally {
      setLoading(false)
    }
  }

  async function deletePod() {
    if (!deletingPodId) return
    setIsDeleting(true)
    try {
      const res = await fetch('/api/admin/pods', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ podId: deletingPodId })
      })

      if (!res.ok) throw new Error('Failed to delete pod')
      
      setPods(pods.filter(p => p.id !== deletingPodId))
      toast.success("Pod deleted successfully")
    } catch (error) {
      console.error('Delete pod error:', error)
      toast.error("Failed to delete pod")
    } finally {
      setIsDeleting(false)
      setDeletingPodId(null)
    }
  }

  const filteredPods = pods.filter(pod => 
    pod.title.toLowerCase().includes(search.toLowerCase()) ||
    pod.npn.toLowerCase().includes(search.toLowerCase()) ||
    pod.founder.email.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight">Pods</h1>
        <p className="text-muted-foreground">Monitor and manage all pods across the platform.</p>
      </div>

      <Card className="border-none shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <div className="relative w-72">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search pods, NPN, or founder..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Badge variant="outline" className="text-muted-foreground">
            {filteredPods.length} Pods Found
          </Badge>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Pod Info</TableHead>
                <TableHead>Founder</TableHead>
                <TableHead>Members</TableHead>
                <TableHead>Subscription</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><div className="h-10 w-48 bg-muted animate-pulse rounded" /></TableCell>
                    <TableCell><div className="h-6 w-32 bg-muted animate-pulse rounded" /></TableCell>
                    <TableCell><div className="h-6 w-12 bg-muted animate-pulse rounded" /></TableCell>
                    <TableCell><div className="h-6 w-24 bg-muted animate-pulse rounded" /></TableCell>
                    <TableCell><div className="h-6 w-24 bg-muted animate-pulse rounded" /></TableCell>
                    <TableCell className="text-right"><div className="h-8 w-8 ml-auto bg-muted animate-pulse rounded" /></TableCell>
                  </TableRow>
                ))
              ) : filteredPods.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                    No pods found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredPods.map((pod) => (
                  <TableRow key={pod.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={pod.avatar_url || undefined} />
                          <AvatarFallback>{pod.title.substring(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="font-medium text-sm">{pod.title}</span>
                          <span className="text-xs text-muted-foreground">{pod.npn}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">{pod.founder.display_name || "Anonymous"}</span>
                        <span className="text-xs text-muted-foreground">{pod.founder.email}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <Users className="h-3 w-3 text-muted-foreground" />
                        {pod.members?.[0]?.count || 0}
                      </div>
                    </TableCell>
                    <TableCell>
                      {pod.subscription?.[0] ? (
                        <div className="flex flex-col gap-1">
                          <Badge variant="outline" className="text-[10px] w-fit">
                            {pod.subscription[0].plan_name}
                          </Badge>
                          <Badge 
                            variant={pod.subscription[0].status === 'active' ? 'default' : 'secondary'}
                            className="text-[10px] w-fit capitalize"
                          >
                            {pod.subscription[0].status}
                          </Badge>
                        </div>
                      ) : (
                        <Badge variant="secondary" className="text-[10px]">No Subscription</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(pod.created_at), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => window.open(`/join/${pod.npn}`, '_blank')}>
                            <ExternalLink className="h-4 w-4 mr-2" />
                            View Public Page
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            className="text-destructive"
                            onClick={() => setDeletingPodId(pod.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete Pod
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <AlertDialog open={!!deletingPodId} onOpenChange={(open) => !open && setDeletingPodId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action will permanently delete the pod and all associated projects, tasks, and files. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={(e) => {
                e.preventDefault()
                deletePod()
              }}
              disabled={isDeleting}
            >
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete Pod
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

import { Card, CardContent, CardHeader } from "@/components/ui/card"
