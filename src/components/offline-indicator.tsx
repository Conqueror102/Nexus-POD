"use client"

import { Wifi, WifiOff, RefreshCw, Cloud, AlertCircle, CheckCircle } from "lucide-react"
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
  lastSyncError?: string | null
}

export function OfflineIndicator({ isOnline, isSyncing, pendingCount, onSync, lastSyncError }: OfflineIndicatorProps) {
  if (isOnline && pendingCount === 0 && !isSyncing && !lastSyncError) {
    return null
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-2">
            {!isOnline ? (
              <Badge variant="destructive" className="gap-1.5 px-2 py-1 animate-pulse">
                <WifiOff className="w-3 h-3" />
                <span className="text-xs">Offline</span>
                {pendingCount > 0 && (
                  <span className="ml-1 text-xs opacity-75">({pendingCount})</span>
                )}
              </Badge>
            ) : isSyncing ? (
              <Badge variant="secondary" className="gap-1.5 px-2 py-1">
                <RefreshCw className="w-3 h-3 animate-spin" />
                <span className="text-xs">Syncing...</span>
              </Badge>
            ) : lastSyncError ? (
              <Button
                variant="destructive"
                size="sm"
                onClick={onSync}
                className="gap-1.5 h-7 px-2"
              >
                <AlertCircle className="w-3 h-3" />
                <span className="text-xs">Retry sync</span>
              </Button>
            ) : pendingCount > 0 ? (
              <Button
                variant="outline"
                size="sm"
                onClick={onSync}
                className="gap-1.5 h-7 px-2 border-amber-500/50 text-amber-600 hover:bg-amber-50 hover:text-amber-700"
              >
                <Cloud className="w-3 h-3" />
                <span className="text-xs">{pendingCount} pending</span>
              </Button>
            ) : null}
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs">
          {!isOnline ? (
            <div className="space-y-1">
              <p className="font-medium">You're working offline</p>
              <p className="text-xs text-muted-foreground">
                {pendingCount > 0 
                  ? `${pendingCount} change${pendingCount !== 1 ? 's' : ''} will sync when you reconnect.`
                  : 'Changes will sync when you reconnect.'
                }
              </p>
            </div>
          ) : isSyncing ? (
            <p>Syncing your offline changes...</p>
          ) : lastSyncError ? (
            <div className="space-y-1">
              <p className="font-medium text-destructive">Sync failed</p>
              <p className="text-xs text-muted-foreground">{lastSyncError}</p>
              <p className="text-xs">Click to retry</p>
            </div>
          ) : pendingCount > 0 ? (
            <p>Click to sync {pendingCount} pending change{pendingCount !== 1 ? 's' : ''}</p>
          ) : null}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
