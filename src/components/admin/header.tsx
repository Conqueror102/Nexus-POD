"use client"

import { ThemeToggle } from "@/components/theme-toggle"
import { Search, Bell } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export function Header() {
  return (
    <header className="h-16 border-b bg-white dark:bg-gray-950 flex items-center justify-between px-6 sticky top-0 z-30">
      <div className="flex-1 max-w-md relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search for users, pods, or logs..."
          className="pl-9 bg-muted/50 border-none h-9 focus-visible:ring-1"
        />
      </div>

      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-4 h-4" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full" />
        </Button>
        <ThemeToggle />
      </div>
    </header>
  )
}
