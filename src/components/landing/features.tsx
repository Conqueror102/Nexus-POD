"use client"

import { FolderKanban, WifiOff, MessageSquare, Clock, Shield, Smartphone, ArrowRight } from "lucide-react"
import { motion } from "framer-motion"

const features = [
  {
    icon: FolderKanban,
    title: "Hierarchy",
    description: "Organize with Pods → Projects → Tasks. A structure designed for clarity.",
    color: "bg-blue-500/10 text-blue-500"
  },
  {
    icon: WifiOff,
    title: "Offline First",
    description: "Work anywhere. Smart sync engine handles conflicts automatically.",
    color: "bg-purple-500/10 text-purple-500"
  },
  {
    icon: MessageSquare,
    title: "Async Chat",
    description: "Context-aware communication within your pods. Zero distractions.",
    color: "bg-emerald-500/10 text-emerald-500"
  },
  {
    icon: Clock,
    title: "Deadline Guard",
    description: "Automated sequence of alerts ensures you never miss a beat.",
    color: "bg-orange-500/10 text-orange-500"
  },
  {
    icon: Shield,
    title: "Security",
    description: "Granular RBAC. Founders maintain complete governance.",
    color: "bg-red-500/10 text-red-500"
  },
  {
    icon: Smartphone,
    title: "Mobile Ready",
    description: "Full desktop experience on any device. Touch optimized.",
    color: "bg-cyan-500/10 text-cyan-500"
  },
]

export function Features() {
  return (
    <section id="features" className="py-24 sm:py-32 relative bg-vintage-green overflow-hidden">
        {/* Background texture */}
      <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23E3F9F5' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")` }} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-20">
          <h2 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4 text-vintage-mint font-serif">Design Architecture</h2>
          <p className="text-vintage-mint/60 text-lg max-w-2xl mx-auto font-light">
            Built with precision. Nexus Pod utilizes a unique hierarchical structure 
            that mirrors high-growth team dynamics.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -5 }}
              className="group relative p-8 rounded-[2rem] border border-vintage-mint/10 bg-vintage-mint/[0.02] backdrop-blur-sm hover:bg-vintage-mint/[0.05] hover:border-vintage-amber/20 transition-all duration-300"
            >
              <div className={`w-14 h-14 rounded-2xl ${feature.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500`}>
                <feature.icon className="w-7 h-7" />
              </div>
              <h3 className="text-2xl font-bold mb-3 text-vintage-mint group-hover:text-vintage-amber transition-colors">{feature.title}</h3>
              <p className="text-vintage-mint/60 leading-relaxed font-light">{feature.description}</p>
              
              <div className="absolute bottom-8 right-8 opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform translate-x-2 group-hover:translate-x-0">
                <div className="w-8 h-8 rounded-full bg-vintage-amber/10 flex items-center justify-center">
                  <ArrowRight className="w-4 h-4 text-vintage-amber" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
