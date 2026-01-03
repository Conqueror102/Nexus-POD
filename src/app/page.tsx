import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { ThemeToggle } from "@/components/theme-toggle"
import { 
  Hexagon, ArrowRight, Users, FolderKanban, MessageSquare, 
  WifiOff, Shield, Clock, CheckCircle2, Zap, Globe
} from "lucide-react"

export default function Home() {
  const features = [
    {
      icon: FolderKanban,
      title: "Pod → Project → Task",
      description: "Organize your work with a clear hierarchy. Create unlimited pods, projects, and tasks with full comment threads."
    },
    {
      icon: Users,
      title: "Simple Team System",
      description: "Invite team members via link. Founders manage tasks, members collaborate freely."
    },
    {
      icon: WifiOff,
      title: "Offline-First",
      description: "Work without internet. Your tasks, projects and chats sync automatically when you're back online."
    },
    {
      icon: MessageSquare,
      title: "Pod Chat",
      description: "Real-time communication within each pod. Text-only, fast, and always in sync."
    },
    {
      icon: Clock,
      title: "Smart Reminders",
      description: "Never miss a deadline. Get notified 24h, 12h, 6h, and 1h before task due dates."
    },
    {
      icon: Shield,
      title: "Role-Based Access",
      description: "Founders control tasks and invites. Members can upload files, comment, and chat."
    },
  ]

  const pricing = [
    {
      name: "Lite",
      price: "2,500",
      period: "/month per pod",
      features: [
        "Up to 10 team members",
        "1GB file storage",
        "Unlimited projects & tasks",
        "Task comments & chat",
        "Offline mode",
        "Email reminders",
      ],
      highlight: true
    },
  ]

  return (
    <div className="min-h-screen bg-background">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse-glow" />
        <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-pulse-glow" style={{ animationDelay: '-2s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-3xl" />
      </div>

      <header className="relative z-10 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2">
              <div className="relative">
                <Hexagon className="w-9 h-9 text-primary fill-primary/10" strokeWidth={1.5} />
                <span className="absolute inset-0 flex items-center justify-center text-primary font-bold text-sm">N</span>
              </div>
              <span className="text-lg font-semibold tracking-tight">Nexus Pod</span>
            </Link>

            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Link href="/login">
                <Button variant="ghost">
                  Sign In
                </Button>
              </Link>
              <Link href="/signup">
                <Button>
                  Get Started
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="relative z-10">
        <section className="py-20 sm:py-32">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-4xl mx-auto">
              <Badge className="bg-primary/10 text-primary border-primary/20 mb-6 px-4 py-1">
                <Globe className="w-3 h-3 mr-2" />
                Built for African Founders
              </Badge>
              
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-tight">
                Your lightweight workspace
                <span className="block text-primary">for building together</span>
              </h1>
              
              <p className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                Nexus Pod is an offline-first workspace for founders, creators, devs, and small teams. 
                Organize pods, manage projects, track tasks, and communicate — all budget-friendly in Naira.
              </p>

              <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href="/signup">
                  <Button size="lg" className="h-12 px-8 text-base">
                    Start Free Trial
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                  <span className="text-sm">No credit card required</span>
                </div>
              </div>
            </div>

            <div className="mt-20 relative">
              <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent z-10 pointer-events-none" />
              <div className="relative rounded-xl border bg-card/50 backdrop-blur-sm overflow-hidden shadow-2xl">
                <div className="flex items-center gap-2 px-4 py-3 border-b bg-muted/50">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-500/80" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                    <div className="w-3 h-3 rounded-full bg-green-500/80" />
                  </div>
                  <span className="text-xs text-muted-foreground ml-2">Nexus Pod Dashboard</span>
                </div>
                <div className="aspect-[16/9] bg-muted/30 flex items-center justify-center">
                  <div className="grid grid-cols-3 gap-4 p-8 w-full max-w-4xl">
                    <div className="col-span-1 space-y-4">
                      <div className="h-8 bg-muted rounded w-3/4 animate-pulse" />
                      <div className="space-y-2">
                        <div className="h-10 bg-primary/20 rounded border border-primary/30" />
                        <div className="h-10 bg-muted rounded" />
                        <div className="h-10 bg-muted rounded" />
                      </div>
                    </div>
                    <div className="col-span-2 space-y-4">
                      <div className="flex justify-between items-center">
                        <div className="h-8 bg-muted rounded w-1/3" />
                        <div className="h-8 bg-primary/30 rounded w-20" />
                      </div>
                      <div className="grid grid-cols-4 gap-3">
                        {[...Array(4)].map((_, i) => (
                          <div key={i} className="h-20 bg-muted rounded-lg p-3">
                            <div className="h-3 bg-muted-foreground/20 rounded w-1/2 mb-2" />
                            <div className="h-6 bg-muted-foreground/10 rounded w-full" />
                          </div>
                        ))}
                      </div>
                      <div className="space-y-2">
                        {[...Array(3)].map((_, i) => (
                          <div key={i} className="h-14 bg-muted/50 rounded flex items-center px-4 gap-3">
                            <div className={`w-4 h-4 rounded-full ${i === 0 ? 'bg-emerald-500' : i === 1 ? 'bg-amber-500' : 'bg-slate-500'}`} />
                            <div className="h-3 bg-muted-foreground/20 rounded w-1/3" />
                            <div className="ml-auto h-6 bg-muted-foreground/10 rounded w-20" />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-20 border-t">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold">
                Everything you need to build
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Simple tools designed for real African startups and teams
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature, index) => (
                <Card key={index} className="hover:border-primary/30 transition-colors">
                  <CardContent className="p-6">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                      <feature.icon className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20 border-t">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 mb-4">
                Budget Friendly
              </Badge>
              <h2 className="text-3xl sm:text-4xl font-bold">
                Simple pricing in Naira
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                No hidden fees. Pay per pod, cancel anytime.
              </p>
            </div>

            <div className="max-w-md mx-auto">
              {pricing.map((plan, index) => (
                <Card key={index} className={`border-2 ${plan.highlight ? 'border-primary/50' : ''}`}>
                  <CardContent className="p-8">
                    <div className="text-center">
                      <h3 className="text-2xl font-bold">{plan.name}</h3>
                      <div className="mt-4 flex items-baseline justify-center gap-1">
                        <span className="text-2xl font-medium text-muted-foreground">₦</span>
                        <span className="text-5xl font-bold">{plan.price}</span>
                        <span className="text-muted-foreground">{plan.period}</span>
                      </div>
                    </div>
                    
                    <ul className="mt-8 space-y-4">
                      {plan.features.map((feature, i) => (
                        <li key={i} className="flex items-center gap-3">
                          <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <Link href="/signup" className="block mt-8">
                      <Button className="w-full h-12">
                        Start 14-Day Free Trial
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20 border-t">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/10 rounded-3xl blur-3xl" />
              <div className="relative bg-card border rounded-2xl p-12">
                <Zap className="w-12 h-12 text-primary mx-auto mb-6" />
                <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                  Ready to build something great?
                </h2>
                <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
                  Join thousands of African founders using Nexus Pod to organize their work 
                  and collaborate with their teams.
                </p>
                <Link href="/signup">
                  <Button size="lg" className="h-12 px-8">
                    Get Started for Free
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="relative z-10 border-t py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="relative">
                <Hexagon className="w-7 h-7 text-primary fill-primary/10" strokeWidth={1.5} />
                <span className="absolute inset-0 flex items-center justify-center text-primary font-bold text-xs">N</span>
              </div>
              <span className="text-sm font-medium text-muted-foreground">Nexus Pod</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} Nexus Pod. Built with love for African founders.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
