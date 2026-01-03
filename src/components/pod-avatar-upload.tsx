"use client"

import { useState, useRef } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Upload, Camera } from "lucide-react"
import { toast } from "sonner"

interface PodAvatarUploadProps {
  podId: string
  currentAvatar: string | null
  podTitle: string
  onAvatarChange: (url: string) => void
  disabled?: boolean
}

export function PodAvatarUpload({ podId, currentAvatar, podTitle, onAvatarChange, disabled }: PodAvatarUploadProps) {
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file")
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
        toast.success("Pod avatar updated!")
      } else {
        const err = await res.json()
        toast.error(err.error || "Failed to upload avatar")
      }
    } catch {
      toast.error("Failed to upload avatar")
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative group">
        <Avatar className="h-16 w-16">
          <AvatarImage src={currentAvatar || undefined} />
          <AvatarFallback className="text-lg bg-primary/10 text-primary">
            {podTitle.substring(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        {!disabled && (
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
          >
            {uploading ? (
              <Loader2 className="w-5 h-5 text-white animate-spin" />
            ) : (
              <Camera className="w-5 h-5 text-white" />
            )}
          </button>
        )}
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />
      {!disabled && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="text-xs"
        >
          {uploading ? (
            <>
              <Loader2 className="w-3 h-3 mr-1 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="w-3 h-3 mr-1" />
              Change Avatar
            </>
          )}
        </Button>
      )}
    </div>
  )
}
