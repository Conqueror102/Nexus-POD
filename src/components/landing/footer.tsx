"use client"

import Link from "next/link"
import { Hexagon, Globe, MessageSquare, Zap } from "lucide-react"

export function Footer() {
  return (
    <footer className="relative z-10 border-t border-vintage-mint/5 py-16 bg-vintage-green">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-12 mb-16">
          <div className="col-span-2">
            <Link href="/" className="flex items-center gap-3 mb-6 group">
              <Hexagon className="w-8 h-8 text-vintage-amber fill-vintage-amber/10 group-hover:rotate-90 transition-transform duration-500" strokeWidth={1.5} />
              <span className="text-xl font-bold tracking-tighter text-vintage-mint">NEXUS POD</span>
            </Link>
            <p className="text-vintage-mint/50 max-w-xs leading-relaxed font-light text-sm">
              The high-performance workspace for moder founders and their elite teams. 
              Built for the next decade of digital creation.
            </p>
          </div>
          <div>
            <h4 className="text-vintage-mint font-bold mb-6 font-serif">Product</h4>
            <ul className="space-y-4 text-vintage-mint/50 text-sm">
              <li><Link href="#" className="hover:text-vintage-amber transition-colors">Features</Link></li>
              <li><Link href="#" className="hover:text-vintage-amber transition-colors">Integrations</Link></li>
              <li><Link href="#" className="hover:text-vintage-amber transition-colors">Updates</Link></li>
              <li><Link href="#" className="hover:text-vintage-amber transition-colors">Pricing</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-vintage-mint font-bold mb-6 font-serif">Company</h4>
            <ul className="space-y-4 text-vintage-mint/50 text-sm">
              <li><Link href="#" className="hover:text-vintage-amber transition-colors">About Us</Link></li>
              <li><Link href="#" className="hover:text-vintage-amber transition-colors">Careers</Link></li>
              <li><Link href="#" className="hover:text-vintage-amber transition-colors">Privacy</Link></li>
              <li><Link href="#" className="hover:text-vintage-amber transition-colors">Terms</Link></li>
            </ul>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-8 border-t border-vintage-mint/5">
          <p className="text-sm text-vintage-mint/40 font-light">
            © {new Date().getFullYear()} NEXUS POD. All rights reserved.
          </p>
          <div className="flex gap-6">
            {[Globe, MessageSquare, Zap].map((Icon, i) => (
              <Link key={i} href="#" className="text-vintage-mint/40 hover:text-vintage-amber transition-colors">
                <Icon className="w-5 h-5" />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}
