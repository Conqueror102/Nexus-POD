"use client"

import { useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { 
  Upload, HardDrive, Download, Eye, Trash2, Loader2,
  FileIcon, Image, FileText
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import type { PodWithRole, Profile, PodFileWithProfile } from "@/lib/types"

interface FilesTabProps {
  selectedPod: PodWithRole
  podFiles: PodFileWithProfile[]
  isFounder: boolean
  user: Profile | null
  onFilePreview: (file: PodFileWithProfile) => void
  onFileDownload: (file: PodFileWithProfile) => void
  onFileDelete: (fileId: string) => void
  fetchPodData: () => void
}

export function FilesTab({
  selectedPod,
  podFiles,
  isFounder,
  user,
  onFilePreview,
  onFileDownload,
  onFileDelete,
  fetchPodData,
}: FilesTabProps) {
  const [uploadingFile, setUploadingFile] = useState(false)
  const [fileDescription, setFileDescription] = useState("")
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function formatFileSize(bytes: number) {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  function getFileIcon(mimeType: string | null) {
    if (mimeType?.startsWith("image/")) return Image
    if (mimeType === "application/pdf") return FileText
    return FileIcon
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !selectedPod) return

    if (file.size > 25 * 1024 * 1024) {
      toast.error("File size exceeds 25MB limit")
      return
    }
    
    // Just trigger the dialog if we have a file
    setIsUploadDialogOpen(true)
  }

  async function confirmUpload() {
    const file = fileInputRef.current?.files?.[0]
    if (!file || !selectedPod) return

    setUploadingFile(true)
    const formData = new FormData()
    formData.append("file", file)
    formData.append("pod_id", selectedPod.id)
    if (fileDescription) formData.append("description", fileDescription)

    const res = await fetch("/api/files", { method: "POST", body: formData })
    if (res.ok) {
      toast.success("File uploaded successfully!")
      setFileDescription("")
      setIsUploadDialogOpen(false)
      fetchPodData()
    } else {
      const err = await res.json()
      toast.error(err.error || "Failed to upload file")
    }
    setUploadingFile(false)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Files</CardTitle>
              <CardDescription>
                {formatFileSize(selectedPod?.storage_used_bytes || 0)} / 1 GB used
              </CardDescription>
            </div>
            <div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                className="hidden"
                accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.zip,.rar"
              />
              <Button onClick={() => fileInputRef.current?.click()} disabled={uploadingFile}>
                {uploadingFile ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                Upload File
              </Button>
            </div>
          </div>
          <Progress value={((selectedPod?.storage_used_bytes || 0) / (1024 * 1024 * 1024)) * 100} className="h-2 mt-2" />
        </CardHeader>
        <CardContent>
          {podFiles.length > 0 ? (
            <div className="space-y-2">
              {podFiles.map((file) => {
                const FileIconComponent = getFileIcon(file.mime_type)
                const canPreview = file.mime_type?.startsWith("image/") || file.mime_type === "application/pdf"
                return (
                  <div key={file.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-lg bg-background flex items-center justify-center">
                        <FileIconComponent className="w-5 h-5 text-muted-foreground" />
                      </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{file.name}</p>
                          {file.description && (
                            <p className="text-xs text-muted-foreground line-clamp-1 italic mb-0.5">
                              {file.description}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground">
                            {formatFileSize(file.size_bytes)} · {file.profiles?.display_name || "Unknown"} · {formatDistanceToNow(new Date(file.created_at), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {canPreview && (
                          <Button variant="ghost" size="icon" onClick={() => onFilePreview(file)} title="Preview">
                            <Eye className="w-4 h-4" />
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" onClick={() => onFileDownload(file)} title="Download">
                          <Download className="w-4 h-4" />
                        </Button>
                        {(isFounder || file.uploaded_by === user?.id) && (
                          <Button variant="ghost" size="icon" onClick={() => onFileDelete(file.id)} className="text-muted-foreground hover:text-destructive" title="Delete">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <HardDrive className="w-12 h-12 text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-medium mb-2">No files yet</h3>
                <p className="text-muted-foreground text-sm mb-4">Upload files to share with your team (max 25MB each)</p>
                <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload First File
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Upload File</DialogTitle>
              <DialogDescription>
                Add a description for the file you're uploading.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <p className="text-sm font-medium">File: <span className="text-muted-foreground font-normal">{fileInputRef.current?.files?.[0]?.name}</span></p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Description (optional)</label>
                <textarea 
                  className="w-full min-h-[100px] p-3 rounded-md border bg-background text-sm"
                  placeholder="Enter file description..."
                  value={fileDescription}
                  onChange={(e) => setFileDescription(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsUploadDialogOpen(false)} disabled={uploadingFile}>Cancel</Button>
              <Button onClick={confirmUpload} disabled={uploadingFile}>
                {uploadingFile ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                Confirm Upload
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    )
  }

