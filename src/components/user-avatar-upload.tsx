"use client"

import { useState, useRef } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Loader2, Camera } from "lucide-react"
import { toast } from "sonner"

interface UserAvatarUploadProps {
  currentAvatar: string | null
  displayName: string
  onAvatarChange: (url: string) => void
  disabled?: boolean
}

export function UserAvatarUpload({ currentAvatar, displayName, onAvatarChange, disabled }: UserAvatarUploadProps) {
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
      const res = await fetch("/api/profile/avatar", {
        method: "POST",
        body: formData,
      })

      if (res.ok) {
        const { avatar_url } = await res.json()
        onAvatarChange(avatar_url)
        toast.success("Profile avatar updated!")
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
    <div className="flex flex-col items-center gap-4">
      <div className="relative group">
        <Avatar className="h-20 w-20">
          <AvatarImage src={currentAvatar || undefined} />
          <AvatarFallback className="text-2xl bg-primary/10 text-primary">
            {displayName?.substring(0, 2).toUpperCase() || "U"}
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
              <Camera className="w-4 h-4 mr-2" />
              Upload Avatar
            </>
          )}
        </Button>
      )}
    </div>
  )
}
