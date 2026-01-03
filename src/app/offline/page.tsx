"use client"

import { WifiOff, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function OfflinePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="text-center space-y-6 max-w-md">
        <div className="mx-auto w-16 h-16 rounded-full bg-orange-500/10 flex items-center justify-center">
          <WifiOff className="w-8 h-8 text-orange-500" />
        </div>
        
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">You're offline</h1>
          <p className="text-muted-foreground">
            No worries! Your data is saved locally. Reconnect to the internet to sync your changes.
          </p>
        </div>

        <Button 
          onClick={() => window.location.reload()} 
          className="gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Try again
        </Button>
      </div>
    </div>
  )
}
