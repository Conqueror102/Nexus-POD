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
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

interface DeleteAccountDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
}

export function DeleteAccountDialog({
  isOpen,
  onOpenChange,
}: DeleteAccountDialogProps) {
  const [step, setStep] = useState<"confirm" | "verify">("confirm")
  const [verificationText, setVerificationText] = useState("")
  const [isDeleting, setIsDeleting] = useState(false)
  const router = useRouter()

  const handleDelete = async () => {
    if (verificationText !== "DELETE MY ACCOUNT") {
      toast.error("Please type the exact text to confirm")
      return
    }

    setIsDeleting(true)
    try {
      const response = await fetch("/api/account/delete", {
        method: "POST",
      })

      if (!response.ok) {
        const error = await response.json()
        toast.error(error.error || "Failed to delete account")
        setIsDeleting(false)
        return
      }

      toast.success("Account deleted successfully")
      
      // Clear auth and redirect to home
      setTimeout(() => {
        window.location.href = "/"
      }, 1000)
    } catch (error) {
      console.error("Delete error:", error)
      toast.error("An error occurred while deleting your account")
      setIsDeleting(false)
    }
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        {step === "confirm" ? (
          <>
            <AlertDialogHeader>
              <AlertDialogTitle className="text-destructive">
                Delete Account?
              </AlertDialogTitle>
              <AlertDialogDescription className="space-y-3 pt-4">
                <p>
                  This action cannot be undone. This will permanently delete your account and remove all of your data including:
                </p>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>Your profile and settings</li>
                  <li>All pods you created</li>
                  <li>All projects and tasks</li>
                  <li>All chat messages</li>
                  <li>Your avatar</li>
                </ul>
                <p className="font-medium text-destructive">
                  Are you sure you want to delete your account?
                </p>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="flex gap-3 pt-4">
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => setStep("verify")}
                className="bg-destructive hover:bg-destructive/90"
              >
                Yes, Delete My Account
              </AlertDialogAction>
            </div>
          </>
        ) : (
          <>
            <AlertDialogHeader>
              <AlertDialogTitle className="text-destructive">
                Confirm Deletion
              </AlertDialogTitle>
              <AlertDialogDescription className="space-y-4 pt-4">
                <p>
                  To confirm you want to permanently delete your account, type the following text exactly:
                </p>
                <div className="bg-muted p-3 rounded font-mono text-sm font-bold">
                  DELETE MY ACCOUNT
                </div>
                <Input
                  placeholder="Type the text above"
                  value={verificationText}
                  onChange={(e) => setVerificationText(e.target.value)}
                  className="mt-4"
                />
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="flex gap-3 pt-4">
              <AlertDialogCancel disabled={isDeleting}>
                Cancel
              </AlertDialogCancel>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={isDeleting || verificationText !== "DELETE MY ACCOUNT"}
              >
                {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isDeleting ? "Deleting..." : "Delete Account"}
              </Button>
            </div>
          </>
        )}
      </AlertDialogContent>
    </AlertDialog>
  )
}
