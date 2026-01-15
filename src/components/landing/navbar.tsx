"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Hexagon, Menu } from "lucide-react"
import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="fixed top-0 w-full z-50 border-b border-vintage-mint/10 bg-vintage-green/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative">
              <div className="absolute inset-0 bg-vintage-amber/20 blur-md group-hover:bg-vintage-amber/40 transition-all" />
              <Hexagon className="relative w-10 h-10 text-vintage-amber fill-vintage-amber/10 transition-transform group-hover:scale-110" strokeWidth={1.5} />
              <span className="absolute inset-0 flex items-center justify-center text-vintage-amber font-bold text-sm">N</span>
            </div>
            <span className="text-xl font-bold tracking-tighter text-vintage-mint">
              NEXUS POD
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-vintage-mint/70">
            <Link href="#features" className="hover:text-vintage-amber transition-colors">Architecture</Link>
            <Link href="#pricing" className="hover:text-vintage-amber transition-colors">Pricing</Link>
            <Link href="#testimonials" className="hover:text-vintage-amber transition-colors">Stories</Link>
          </nav>

          <div className="flex items-center gap-4">
            <Link href="/login" className="hidden sm:block">
              <Button variant="ghost" className="text-vintage-mint hover:text-vintage-amber hover:bg-vintage-mint/5">
                Sign In
              </Button>
            </Link>
            <Link href="/signup">
              <Button className="bg-vintage-amber text-vintage-green hover:bg-vintage-amber/90 font-bold px-6 shadow-[0_0_20px_rgba(252,211,77,0.15)]">
                Launch App
              </Button>
            </Link>
            <button className="md:hidden text-vintage-mint" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              <Menu />
            </button>
          </div>
        </div>
      </div>
      
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-vintage-green border-b border-vintage-mint/10 overflow-hidden"
          >
            <div className="px-4 py-4 space-y-4 flex flex-col">
              <Link href="#features" className="text-vintage-mint/80 hover:text-vintage-amber" onClick={() => setMobileMenuOpen(false)}>Architecture</Link>
              <Link href="#pricing" className="text-vintage-mint/80 hover:text-vintage-amber" onClick={() => setMobileMenuOpen(false)}>Pricing</Link>
              <Link href="/login" className="text-vintage-mint/80 hover:text-vintage-amber" onClick={() => setMobileMenuOpen(false)}>Sign In</Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
