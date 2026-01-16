import {
  Wifi,
  WifiOff,
  Users,
  FolderKanban,
  MessageSquare,
  FileUp,
  Shield,
  Zap,
} from "lucide-react"

const features = [
  {
    icon: WifiOff,
    title: "Offline-First",
    description: "Work without internet. Your data syncs automatically when you're back online. Built for African realities.",
  },
  {
    icon: Users,
    title: "Team Pods",
    description: "Create dedicated workspaces for your team. Invite members, assign roles, and collaborate seamlessly.",
  },
  {
    icon: FolderKanban,
    title: "Projects & Tasks",
    description: "Organize work into projects. Track tasks with boards, due dates, and progress indicators.",
  },
  {
    icon: MessageSquare,
    title: "Team Chat",
    description: "Real-time messaging within your pod. Keep conversations focused and searchable.",
  },
  {
    icon: FileUp,
    title: "File Storage",
    description: "Upload and share files with your team. Secure cloud storage with smart organization.",
  },
  {
    icon: Shield,
    title: "Secure by Default",
    description: "Enterprise-grade security with role-based access. Your data stays protected.",
  },
]

export function FeaturesSection() {
  return (
    <section id="features" className="relative py-24 md:py-32">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-px bg-gradient-to-r from-transparent via-border to-transparent" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16 md:mb-20">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-6">
            <Zap className="w-4 h-4" />
            <span>Powerful Features</span>
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-6">
            Everything You Need,{" "}
            <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Nothing You Don't
            </span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Designed for speed, simplicity, and the African context. No bloat, no learning curve.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className="group relative p-6 md:p-8 rounded-2xl bg-card/50 border border-border/50 hover:border-primary/30 hover:bg-card/80 transition-all duration-300"
            >
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              
              <div className="relative">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-5 group-hover:bg-primary/20 transition-colors">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                
                <h3 className="text-lg font-semibold mb-3">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16 md:mt-20 p-8 md:p-12 rounded-3xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/20">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="flex-shrink-0">
              <div className="w-20 h-20 rounded-2xl bg-primary/20 flex items-center justify-center">
                <Wifi className="w-10 h-10 text-primary" />
              </div>
            </div>
            <div className="text-center md:text-left flex-1">
              <h3 className="text-2xl font-bold mb-3">Built for Africa's Connectivity</h3>
              <p className="text-muted-foreground text-lg">
                We understand that internet can be unreliable. Nexus Pod works offline and syncs when you're back online. 
                Your productivity shouldn't depend on your ISP.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
