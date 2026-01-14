"use client"

import Link from "next/link"
import { motion, useScroll, useTransform } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ThemeToggle } from "@/components/theme-toggle"
import { 
  Hexagon, ArrowRight, Users, FolderKanban, MessageSquare, 
  WifiOff, Shield, Clock, CheckCircle2, Zap, Globe, Sparkles,
  Layers, ZapIcon, Lock, Layout, MousePointer2, Smartphone
} from "lucide-react"
import { useRef } from "react"

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

export default function Home() {
  const targetRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: targetRef,
    offset: ["start end", "end start"]
  })

  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0])
  const scale = useTransform(scrollYProgress, [0, 0.2], [0.8, 1])

  const features = [
    {
      icon: FolderKanban,
      title: "Architectural Hierarchy",
      description: "Organize with Pods → Projects → Tasks. A structure designed for clarity and rapid execution.",
      color: "blue"
    },
    {
      icon: WifiOff,
      title: "Offline Intelligence",
      description: "Work anywhere. Our smart sync engine handles conflicts while you focus on building.",
      color: "purple"
    },
    {
      icon: MessageSquare,
      title: "Synchronous Chat",
      description: "Context-aware communication. Chat directly within your pods with lightning speed.",
      color: "emerald"
    },
    {
      icon: Clock,
      title: "Predictive Reminders",
      description: "Automated sequence of alerts (24h, 12h, 6h, 1h) ensures deadlines are never missed.",
      color: "orange"
    },
    {
      icon: Shield,
      title: "Enterprise Security",
      description: "Granular role-based access control. Founders maintain complete governance.",
      color: "red"
    },
    {
      icon: Smartphone,
      title: "Mobile Optimized",
      description: "A desktop-class experience on any device. Fully responsive and touch-optimized.",
      color: "cyan"
    },
  ]

  return (
    <div className="min-h-screen bg-[#020617] text-slate-50 selection:bg-primary/30 overflow-x-hidden">
      {/* Premium Background Elements */}
      <div className="fixed inset-0 z-0">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] mix-blend-screen animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[120px] mix-blend-screen animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#020617]/50 to-[#020617]" />
      </div>

      <header className="fixed top-0 w-full z-50 border-b border-white/5 bg-[#020617]/50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="relative">
                <div className="absolute inset-0 bg-primary/20 blur-md group-hover:bg-primary/40 transition-all" />
                <Hexagon className="relative w-10 h-10 text-primary fill-primary/10 transition-transform group-hover:scale-110" strokeWidth={1.5} />
                <span className="absolute inset-0 flex items-center justify-center text-primary font-bold text-sm">N</span>
              </div>
              <span className="text-xl font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
                NEXUS POD
              </span>
            </Link>

            <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-400">
              <Link href="#features" className="hover:text-white transition-colors">Architecture</Link>
              <Link href="#pricing" className="hover:text-white transition-colors">Pricing</Link>
              <Link href="#about" className="hover:text-white transition-colors">About</Link>
            </nav>

            <div className="flex items-center gap-4">
              <ThemeToggle />
              <Link href="/login" className="hidden sm:block">
                <Button variant="ghost" className="text-slate-300 hover:text-white hover:bg-white/5">
                  Sign In
                </Button>
              </Link>
              <Link href="/signup">
                <Button className="bg-white text-black hover:bg-white/90 font-semibold px-6 shadow-[0_0_20px_rgba(255,255,255,0.15)]">
                  Launch App
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="relative z-10">
        {/* Hero Section */}
        <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div 
              initial="initial"
              animate="animate"
              variants={stagger}
              className="text-center max-w-4xl mx-auto"
            >
              <motion.div variants={fadeInUp}>
                <Badge className="bg-primary/10 text-primary border-primary/20 mb-8 px-6 py-1.5 text-sm font-medium backdrop-blur-md">
                  <Sparkles className="w-4 h-4 mr-2 inline-block text-yellow-400" />
                  The New Standard for High-Performance Teams
                </Badge>
              </motion.div>
              
              <motion.h1 
                variants={fadeInUp}
                className="text-5xl sm:text-7xl lg:text-8xl font-bold tracking-tight leading-[0.9] bg-clip-text text-transparent bg-gradient-to-b from-white via-white to-white/40 mb-8"
              >
                Organize. Offline. <br />
                <span className="text-primary">Sync Everywhere.</span>
              </motion.h1>
              
              <motion.p 
                variants={fadeInUp}
                className="mt-6 text-xl sm:text-2xl text-slate-400 max-w-2xl mx-auto leading-relaxed font-light"
              >
                The offline-first workspace designed for the modern founder. 
                Sleek architecture, lightning-fast sync, and zero friction.
              </motion.p>

              <motion.div 
                variants={fadeInUp}
                className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-6"
              >
                <Link href="/signup">
                  <Button size="lg" className="h-14 px-10 text-lg bg-primary hover:bg-primary/90 text-white shadow-2xl shadow-primary/20 border-t border-white/20">
                    Get Started Free
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
                <div className="flex -space-x-3">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="w-10 h-10 rounded-full border-2 border-[#020617] bg-slate-800 flex items-center justify-center">
                      <Users className="w-4 h-4 text-slate-400" />
                    </div>
                  ))}
                  <div className="pl-6 flex items-center gap-2 text-slate-400 text-sm font-medium">
                    <span className="text-white">500+</span> Founders Joined
                  </div>
                </div>
              </motion.div>
            </motion.div>

            {/* Floating Preview */}
            <motion.div 
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="mt-24 relative max-w-6xl mx-auto"
            >
              <div className="absolute -inset-1 bg-gradient-to-r from-primary/50 to-purple-600/50 rounded-[2.5rem] blur-2xl opacity-20 group-hover:opacity-40 transition duration-1000" />
              <div className="relative rounded-[2rem] border border-white/10 bg-[#0f172a]/80 backdrop-blur-2xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)]">
                <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-white/5">
                  <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500/50" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
                    <div className="w-3 h-3 rounded-full bg-green-500/50" />
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="h-4 w-32 bg-white/5 rounded-full" />
                    <div className="h-4 w-4 bg-white/5 rounded-full" />
                  </div>
                </div>
                <div className="aspect-[16/10] bg-gradient-to-br from-[#0f172a] to-[#020617] p-8">
                  <div className="grid grid-cols-12 gap-6 h-full">
                    <div className="col-span-3 space-y-6">
                      <div className="h-10 bg-primary/20 rounded-xl border border-primary/20 flex items-center px-4">
                        <div className="w-4 h-4 rounded bg-primary/40 mr-3" />
                        <div className="h-2 w-20 bg-primary/40 rounded" />
                      </div>
                      <div className="space-y-3">
                        {[1, 2, 3, 4, 5].map(i => (
                          <div key={i} className="h-10 bg-white/5 rounded-xl border border-white/5 flex items-center px-4">
                            <div className="w-4 h-4 rounded bg-white/10 mr-3" />
                            <div className="h-2 w-16 bg-white/10 rounded" />
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="col-span-9 space-y-6">
                      <div className="flex justify-between items-end pb-4 border-b border-white/5">
                        <div className="space-y-2">
                          <div className="h-3 w-24 bg-white/10 rounded" />
                          <div className="h-8 w-48 bg-white/20 rounded-lg" />
                        </div>
                        <div className="h-10 w-32 bg-primary rounded-xl" />
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        {[1, 2, 3].map(i => (
                          <div key={i} className="h-32 bg-white/5 rounded-2xl border border-white/5 p-4 space-y-3">
                            <div className="h-2 w-12 bg-white/10 rounded" />
                            <div className="h-4 w-full bg-white/20 rounded" />
                            <div className="flex gap-2">
                              <div className="h-6 w-16 bg-white/5 rounded-full" />
                              <div className="h-6 w-16 bg-white/5 rounded-full" />
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="space-y-3">
                        {[1, 2].map(i => (
                          <div key={i} className="h-16 bg-white/5 rounded-2xl border border-white/5 flex items-center px-6 gap-4">
                            <div className="w-5 h-5 rounded-full border border-white/20" />
                            <div className="h-3 w-40 bg-white/10 rounded" />
                            <div className="ml-auto flex gap-2">
                              <div className="h-6 w-12 bg-emerald-500/10 rounded-full border border-emerald-500/20" />
                              <div className="h-6 w-6 bg-white/10 rounded-full" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Bento Grid Features */}
        <section id="features" className="py-24 sm:py-32 relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-20">
              <h2 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4">Design Architecture</h2>
              <p className="text-slate-400 text-lg max-w-2xl mx-auto">
                Built with precision. Nexus Pod utilizes a unique hierarchical structure 
                that mirrors high-growth team dynamics.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  whileHover={{ y: -5 }}
                  className="group relative p-8 rounded-[2rem] border border-white/5 bg-white/[0.02] backdrop-blur-sm hover:bg-white/[0.05] transition-all duration-300"
                >
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500`}>
                    <feature.icon className="w-7 h-7 text-primary" />
                  </div>
                  <h3 className="text-2xl font-bold mb-3 text-white">{feature.title}</h3>
                  <p className="text-slate-400 leading-relaxed font-light">{feature.description}</p>
                  
                  <div className="absolute bottom-8 right-8 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center">
                      <ArrowRight className="w-4 h-4 text-primary" />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-24 border-y border-white/5 relative bg-white/[0.01]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-12">
              {[
                { label: "Uptime", value: "99.9%" },
                { label: "Sync Speed", value: "< 100ms" },
                { label: "Daily Active", value: "12k+" },
                { label: "Storage", value: "Unlimited" },
              ].map((stat, i) => (
                <div key={i} className="text-center">
                  <div className="text-4xl sm:text-5xl font-bold text-white mb-2">{stat.value}</div>
                  <div className="text-slate-500 font-medium tracking-widest text-xs uppercase">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 sm:py-32">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="relative rounded-[3rem] p-12 sm:p-20 overflow-hidden text-center border border-white/10">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-purple-600/10 to-transparent" />
              <div className="absolute inset-0 bg-[#0f172a]/40 backdrop-blur-3xl" />
              
              <div className="relative z-10">
                <h2 className="text-4xl sm:text-6xl font-bold tracking-tight mb-8">
                  Ready for the Next <br />
                  <span className="text-primary">Generation?</span>
                </h2>
                <p className="text-xl text-slate-300 mb-12 max-w-2xl mx-auto font-light leading-relaxed">
                  Join the elite group of founders who prioritize architectural clarity 
                  and seamless execution.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <Link href="/signup">
                    <Button size="lg" className="h-16 px-12 text-xl bg-white text-black hover:bg-white/90 font-bold rounded-2xl shadow-2xl">
                      Get Started Now
                    </Button>
                  </Link>
                  <Button variant="ghost" className="h-16 px-12 text-xl text-white hover:bg-white/5 border border-white/10 rounded-2xl">
                    View Demo
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="relative z-10 border-t border-white/5 py-16 bg-[#020617]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12 mb-16">
            <div className="col-span-2">
              <Link href="/" className="flex items-center gap-3 mb-6">
                <Hexagon className="w-8 h-8 text-primary fill-primary/10" strokeWidth={1.5} />
                <span className="text-xl font-bold tracking-tighter text-white">NEXUS POD</span>
              </Link>
              <p className="text-slate-400 max-w-xs leading-relaxed font-light">
                The high-performance workspace for modern founders and their elite teams. 
                Built for the next decade of digital creation.
              </p>
            </div>
            <div>
              <h4 className="text-white font-bold mb-6">Product</h4>
              <ul className="space-y-4 text-slate-500 text-sm">
                <li><Link href="#" className="hover:text-primary transition-colors">Features</Link></li>
                <li><Link href="#" className="hover:text-primary transition-colors">Integrations</Link></li>
                <li><Link href="#" className="hover:text-primary transition-colors">Updates</Link></li>
                <li><Link href="#" className="hover:text-primary transition-colors">Pricing</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-bold mb-6">Company</h4>
              <ul className="space-y-4 text-slate-500 text-sm">
                <li><Link href="#" className="hover:text-primary transition-colors">About Us</Link></li>
                <li><Link href="#" className="hover:text-primary transition-colors">Careers</Link></li>
                <li><Link href="#" className="hover:text-primary transition-colors">Privacy</Link></li>
                <li><Link href="#" className="hover:text-primary transition-colors">Terms</Link></li>
              </ul>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-8 border-t border-white/5">
            <p className="text-sm text-slate-500 font-light">
              © {new Date().getFullYear()} NEXUS POD. All rights reserved.
            </p>
            <div className="flex gap-6">
              {[Globe, MessageSquare, Zap].map((Icon, i) => (
                <Link key={i} href="#" className="text-slate-500 hover:text-white transition-colors">
                  <Icon className="w-5 h-5" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
