"use client"

import { useState } from "react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import type { PodWithRole } from "@/lib/types"

interface DeletePodDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  pod: PodWithRole | null
  onDeleteSuccess: () => void
}

export function DeletePodDialog({
  isOpen,
  onOpenChange,
  pod,
  onDeleteSuccess,
}: DeletePodDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    if (!pod) return

    setIsDeleting(true)
    try {
      const response = await fetch(`/api/pods/${pod.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const error = await response.json()
        toast.error(error.error || "Failed to delete pod")
        setIsDeleting(false)
        return
      }

      toast.success("Pod deleted successfully")
      onOpenChange(false)
      onDeleteSuccess()
    } catch (error) {
      console.error("Delete pod error:", error)
      toast.error("An error occurred while deleting the pod")
      setIsDeleting(false)
    }
  }

  if (!pod) return null

  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="text-destructive">Delete Pod?</AlertDialogTitle>
          <AlertDialogDescription className="space-y-3 pt-4">
            <p>
              Are you sure you want to delete <span className="font-semibold">{pod.name}</span>?
            </p>
            <p className="text-sm">
              This will permanently delete the pod and all associated:
            </p>
            <ul className="list-disc list-inside space-y-1 text-sm ml-2">
              <li>Projects</li>
              <li>Tasks</li>
              <li>Chat messages</li>
              <li>Files</li>
              <li>Member associations</li>
            </ul>
            <p className="text-destructive font-medium">
              This action cannot be undone.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="flex gap-3 pt-4">
          <AlertDialogCancel disabled={isDeleting}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isDeleting}
            className="bg-destructive hover:bg-destructive/90"
          >
            {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isDeleting ? "Deleting..." : "Delete Pod"}
          </AlertDialogAction>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  )
}
