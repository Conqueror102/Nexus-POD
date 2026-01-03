"use client"

import { useEffect, useState } from "react"
import { Hexagon } from "lucide-react"

export function SplashScreen({ onComplete }: { onComplete: () => void }) {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer)
          setTimeout(onComplete, 200)
          return 100
        }
        return prev + 10
      })
    }, 100)

    return () => clearInterval(timer)
  }, [onComplete])

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "-2s" }} />
      </div>
      
      <div className="relative z-10 flex flex-col items-center">
        <div className="relative mb-6">
          <Hexagon className="w-20 h-20 text-primary fill-primary/10 animate-pulse" strokeWidth={1.5} />
          <span className="absolute inset-0 flex items-center justify-center text-primary font-bold text-2xl">N</span>
        </div>
        
        <h1 className="text-2xl font-semibold tracking-tight mb-2">Nexus Pod</h1>
        <p className="text-muted-foreground text-sm mb-8">Loading your workspace...</p>
        
        <div className="w-48 h-1 bg-muted rounded-full overflow-hidden">
          <div 
            className="h-full bg-primary transition-all duration-200 ease-out rounded-full"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  )
}
