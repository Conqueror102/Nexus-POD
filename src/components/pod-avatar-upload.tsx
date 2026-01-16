"use client"

import { useState, useRef } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Loader2, Upload, Camera, ImageIcon, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface PodAvatarUploadProps {
  podId: string
  currentAvatar: string | null
  podTitle: string
  onAvatarChange: (url: string) => void
  disabled?: boolean
  variant?: "default" | "large"
}

export function PodAvatarUpload({ podId, currentAvatar, podTitle, onAvatarChange, disabled, variant = "default" }: PodAvatarUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) await uploadFile(file)
  }

  async function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file) await uploadFile(file)
  }

  async function uploadFile(file: File) {
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file (PNG, JPG, GIF)")
      return
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image must be less than 2MB")
      return
    }

    setUploading(true)
    const formData = new FormData()
    formData.append("avatar", file)

    try {
      const res = await fetch(`/api/pods/${podId}/avatar`, {
        method: "POST",
        body: formData,
      })

      if (res.ok) {
        const { avatar_url } = await res.json()
        onAvatarChange(avatar_url)
        toast.success("Pod logo updated!")
      } else {
        const err = await res.json()
        toast.error(err.error || "Failed to upload logo")
      }
    } catch {
      toast.error("Failed to upload logo")
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  const isLarge = variant === "large"

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="relative group flex-shrink-0">
          <Avatar className={cn(
            "border-2 border-border/50 transition-all",
            isLarge ? "h-24 w-24" : "h-16 w-16",
            !disabled && "group-hover:border-primary/50"
          )}>
            <AvatarImage src={currentAvatar || undefined} className="object-cover" />
            <AvatarFallback className={cn(
              "bg-primary/10 text-primary font-semibold",
              isLarge ? "text-2xl" : "text-lg"
            )}>
              {podTitle.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          {!disabled && (
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className={cn(
                "absolute inset-0 flex items-center justify-center bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition-all",
                uploading && "opacity-100"
              )}
            >
              {uploading ? (
                <Loader2 className={cn("text-white animate-spin", isLarge ? "w-8 h-8" : "w-5 h-5")} />
              ) : (
                <Camera className={cn("text-white", isLarge ? "w-8 h-8" : "w-5 h-5")} />
              )}
            </button>
          )}
        </div>

        <div className="flex-1 space-y-2">
          <div>
            <h4 className="font-medium text-sm">Pod Logo</h4>
            <p className="text-xs text-muted-foreground">
              Your logo appears in the sidebar and team views
            </p>
          </div>
          {!disabled && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Logo
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </div>

      {!disabled && (
        <div
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            "border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all",
            dragOver
              ? "border-primary bg-primary/5"
              : "border-border/50 hover:border-primary/50 hover:bg-muted/30"
          )}
        >
          <div className="flex flex-col items-center gap-2">
            <div className={cn(
              "w-12 h-12 rounded-xl flex items-center justify-center transition-colors",
              dragOver ? "bg-primary/20" : "bg-muted"
            )}>
              <ImageIcon className={cn(
                "w-6 h-6 transition-colors",
                dragOver ? "text-primary" : "text-muted-foreground"
              )} />
            </div>
            <div>
              <p className="text-sm font-medium">
                {dragOver ? "Drop to upload" : "Drag and drop your logo"}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                PNG, JPG or GIF up to 2MB
              </p>
            </div>
          </div>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/gif,image/webp"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  )
}
