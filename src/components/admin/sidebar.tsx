"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { 
  LayoutDashboard, 
  Users, 
  Box, 
  CreditCard, 
  History, 
  Settings, 
  Hexagon,
  LogOut
} from "lucide-react"
import { Button } from "@/components/ui/button"

const menuItems = [
  {
    title: "Overview",
    href: "/admin",
    icon: LayoutDashboard
  },
  {
    title: "Users",
    href: "/admin/users",
    icon: Users
  },
  {
    title: "Pods",
    href: "/admin/pods",
    icon: Box
  },
  {
    title: "Pricing & Features",
    href: "/admin/pricing",
    icon: CreditCard
  },
  {
    title: "Audit Logs",
    href: "/admin/audit",
    icon: History
  }
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-64 border-r bg-white dark:bg-gray-950 flex flex-col h-screen sticky top-0">
      <div className="p-6 border-b">
        <Link href="/" className="flex items-center gap-2">
          <div className="relative">
            <Hexagon className="w-8 h-8 text-primary fill-primary/10" strokeWidth={1.5} />
            <span className="absolute inset-0 flex items-center justify-center text-primary font-bold text-xs">A</span>
          </div>
          <span className="text-lg font-semibold tracking-tight">Admin Console</span>
        </Link>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {menuItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
              pathname === item.href
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <item.icon className="w-4 h-4" />
            {item.title}
          </Link>
        ))}
      </nav>

      <div className="p-4 border-t space-y-2">
        <Link href="/dashboard">
          <Button variant="outline" className="w-full justify-start gap-3">
            <LayoutDashboard className="w-4 h-4" />
            App Dashboard
          </Button>
        </Link>
        <Button variant="ghost" className="w-full justify-start gap-3 text-destructive hover:text-destructive hover:bg-destructive/10">
          <LogOut className="w-4 h-4" />
          Sign Out
        </Button>
      </div>
    </aside>
  )
}
