"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { X, Download, ZoomIn, ZoomOut, ChevronLeft, ChevronRight, FileText, File } from "lucide-react"
import { Button } from "@/components/ui/button"

interface FilePreviewProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  file: {
    name: string
    url: string
    mime_type: string | null
  } | null
}

export function FilePreview({ open, onOpenChange, file }: FilePreviewProps) {
  const [zoom, setZoom] = useState(1)

  if (!file) return null

  const isImage = file.mime_type?.startsWith("image/")
  const isPDF = file.mime_type === "application/pdf"

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.25, 3))
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.25, 0.5))

  const handleDownload = () => {
    const link = document.createElement("a")
    link.href = file.url
    link.download = file.name
    link.target = "_blank"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden">
        <DialogHeader className="p-4 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              {isImage ? (
                <File className="w-5 h-5 text-primary flex-shrink-0" />
              ) : isPDF ? (
                <FileText className="w-5 h-5 text-red-500 flex-shrink-0" />
              ) : (
                <File className="w-5 h-5 text-muted-foreground flex-shrink-0" />
              )}
              <DialogTitle className="truncate">{file.name}</DialogTitle>
            </div>
            <div className="flex items-center gap-2">
              {isImage && (
                <>
                  <Button variant="ghost" size="icon" onClick={handleZoomOut}>
                    <ZoomOut className="w-4 h-4" />
                  </Button>
                  <span className="text-sm text-muted-foreground min-w-[4ch] text-center">
                    {Math.round(zoom * 100)}%
                  </span>
                  <Button variant="ghost" size="icon" onClick={handleZoomIn}>
                    <ZoomIn className="w-4 h-4" />
                  </Button>
                </>
              )}
              <Button variant="ghost" size="icon" onClick={handleDownload}>
                <Download className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <DialogDescription className="sr-only">
            Preview of {file.name}
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 overflow-auto p-4 bg-muted/30 min-h-[400px] max-h-[70vh] flex items-center justify-center">
          {isImage ? (
            <div className="overflow-auto max-w-full max-h-full">
              <img
                src={file.url}
                alt={file.name}
                className="max-w-none transition-transform duration-200"
                style={{ transform: `scale(${zoom})`, transformOrigin: "center" }}
              />
            </div>
          ) : isPDF ? (
            <iframe
              src={`${file.url}#view=FitH`}
              className="w-full h-full min-h-[500px] border-0 rounded"
              title={file.name}
            />
          ) : (
            <div className="text-center">
              <File className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">Preview not available for this file type</p>
              <Button onClick={handleDownload}>
                <Download className="w-4 h-4 mr-2" />
                Download File
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
