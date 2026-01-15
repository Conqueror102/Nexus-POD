"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, Sparkles, Users } from "lucide-react"
import { motion } from "framer-motion"
import Link from "next/link"

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] }
}

const stagger = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
}

export function Hero() {
  return (
    <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
      {/* Vintage Grain & Gradient Overlays */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-vintage-mint/5 rounded-full blur-[120px] mix-blend-overlay" />
        <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-vintage-amber/5 rounded-full blur-[120px] mix-blend-overlay" />
        <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }} />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div 
          initial="initial"
          animate="animate"
          variants={stagger}
          className="text-center max-w-4xl mx-auto"
        >
          <motion.div variants={fadeInUp}>
            <Badge className="bg-vintage-amber/10 text-vintage-amber border-vintage-amber/20 mb-8 px-6 py-1.5 text-sm font-medium backdrop-blur-md">
              <Sparkles className="w-4 h-4 mr-2 inline-block" />
              The New Standard for High-Performance Teams
            </Badge>
          </motion.div>
          
          <motion.h1 
            variants={fadeInUp}
            className="text-5xl sm:text-7xl lg:text-8xl font-bold tracking-tight leading-[0.9] text-vintage-mint mb-8 font-serif"
          >
            Organize. Offline. <br />
            <span className="text-vintage-amber italic">Sync Everywhere.</span>
          </motion.h1>
          
          <motion.p 
            variants={fadeInUp}
            className="mt-6 text-xl sm:text-2xl text-vintage-mint/60 max-w-2xl mx-auto leading-relaxed font-light"
          >
            The offline-first workspace designed for the modern founder. 
            Sleek architecture, lightning-fast sync, and zero friction.
          </motion.p>

          <motion.div 
            variants={fadeInUp}
            className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-6"
          >
            <Link href="/signup">
              <Button size="lg" className="h-14 px-10 text-lg bg-vintage-amber hover:bg-vintage-amber/90 text-vintage-green font-bold shadow-xl shadow-vintage-amber/10">
                Get Started Free
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <div className="flex items-center gap-4">
                <div className="flex -space-x-3">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="w-10 h-10 rounded-full border-2 border-vintage-green bg-vintage-mint/10 flex items-center justify-center">
                    <Users className="w-4 h-4 text-vintage-mint/60" />
                    </div>
                ))}
                </div>
                <div className="text-vintage-mint/60 text-sm font-medium">
                    <span className="text-vintage-mint font-bold">500+</span> Founders Joined
                </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}
