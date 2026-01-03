"use client"

import { Wifi, WifiOff, RefreshCw, Cloud } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface OfflineIndicatorProps {
  isOnline: boolean
  isSyncing: boolean
  pendingCount: number
  onSync: () => void
}

export function OfflineIndicator({ isOnline, isSyncing, pendingCount, onSync }: OfflineIndicatorProps) {
  if (isOnline && pendingCount === 0 && !isSyncing) {
    return null
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-2">
            {!isOnline ? (
              <Badge variant="destructive" className="gap-1.5 px-2 py-1">
                <WifiOff className="w-3 h-3" />
                <span className="text-xs">Offline</span>
              </Badge>
            ) : isSyncing ? (
              <Badge variant="secondary" className="gap-1.5 px-2 py-1">
                <RefreshCw className="w-3 h-3 animate-spin" />
                <span className="text-xs">Syncing...</span>
              </Badge>
            ) : pendingCount > 0 ? (
              <Button
                variant="outline"
                size="sm"
                onClick={onSync}
                className="gap-1.5 h-7 px-2"
              >
                <Cloud className="w-3 h-3" />
                <span className="text-xs">{pendingCount} pending</span>
              </Button>
            ) : null}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          {!isOnline ? (
            <p>You're working offline. Changes will sync when you reconnect.</p>
          ) : isSyncing ? (
            <p>Syncing your offline changes...</p>
          ) : pendingCount > 0 ? (
            <p>Click to sync {pendingCount} pending change{pendingCount !== 1 ? 's' : ''}</p>
          ) : null}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
