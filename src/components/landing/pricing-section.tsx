import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Check, Sparkles, Zap } from "lucide-react"
import { cn } from "@/lib/utils"

interface Plan {
  id: string
  name: string
  code: string
  amount: number
  interval: string
  member_limit: number
  storage_gb: number
  features: string[]
  is_active: boolean
  popular?: boolean
}

interface PricingSectionProps {
  plans: Plan[]
}

const defaultPlans: Plan[] = [
  {
    id: "free",
    name: "Free",
    code: "free_plan",
    amount: 0,
    interval: "monthly",
    member_limit: 3,
    storage_gb: 0.5,
    features: [
      "Up to 3 members",
      "500MB storage",
      "Basic task management",
      "Team chat",
      "7-day activity history",
    ],
    is_active: true,
  },
  {
    id: "lite",
    name: "Lite Tier",
    code: "lite_plan",
    amount: 500000,
    interval: "monthly",
    member_limit: 10,
    storage_gb: 1,
    features: [
      "Up to 10 members",
      "1GB storage",
      "Priority support",
      "Advanced features",
      "30-day activity history",
      "File versioning",
    ],
    is_active: true,
    popular: true,
  },
  {
    id: "pro",
    name: "Pro Tier",
    code: "pro_plan",
    amount: 1500000,
    interval: "monthly",
    member_limit: 50,
    storage_gb: 10,
    features: [
      "Up to 50 members",
      "10GB storage",
      "Dedicated support",
      "All premium features",
      "Unlimited activity history",
      "Custom integrations",
      "API access",
    ],
    is_active: true,
  },
]

export function PricingSection({ plans }: PricingSectionProps) {
  const displayPlans = plans.length > 0 ? plans : defaultPlans
  
  const allPlans = [
    defaultPlans[0],
    ...displayPlans.filter(p => p.amount > 0),
  ]

  if (allPlans.length < 3) {
    allPlans.push(defaultPlans[2])
  }

  return (
    <section id="pricing" className="relative py-24 md:py-32 bg-muted/30">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-px bg-gradient-to-r from-transparent via-border to-transparent" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full h-px bg-gradient-to-r from-transparent via-border to-transparent" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16 md:mb-20">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-6">
            <Sparkles className="w-4 h-4" />
            <span>Simple Pricing</span>
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-6">
            Pricing That Makes Sense{" "}
            <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              in Naira
            </span>
          </h2>
          <p className="text-lg text-muted-foreground">
            No hidden fees, no dollar conversions. Just straightforward pricing built for African businesses.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 lg:gap-8 max-w-5xl mx-auto">
          {allPlans.slice(0, 3).map((plan, index) => {
            const isPopular = plan.popular || index === 1
            
            return (
              <div
                key={plan.id}
                className={cn(
                  "relative rounded-2xl p-6 md:p-8 transition-all duration-300",
                  isPopular
                    ? "bg-card border-2 border-primary shadow-xl shadow-primary/10 scale-105 z-10"
                    : "bg-card/50 border border-border/50 hover:border-primary/30"
                )}
              >
                {isPopular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <div className="px-4 py-1.5 rounded-full bg-primary text-primary-foreground text-xs font-semibold shadow-lg">
                      Most Popular
                    </div>
                  </div>
                )}

                <div className="text-center mb-6">
                  <div className={cn(
                    "w-12 h-12 rounded-xl mx-auto mb-4 flex items-center justify-center",
                    isPopular ? "bg-primary/20" : "bg-primary/10"
                  )}>
                    <Zap className={cn("w-6 h-6", isPopular ? "text-primary" : "text-primary/70")} />
                  </div>
                  <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                  <div className="mb-4">
                    {plan.amount === 0 ? (
                      <div className="flex items-baseline justify-center gap-1">
                        <span className="text-4xl font-bold">Free</span>
                      </div>
                    ) : (
                      <div className="flex items-baseline justify-center gap-1">
                        <span className="text-4xl font-bold">₦{(plan.amount / 100).toLocaleString()}</span>
                        <span className="text-muted-foreground">/{plan.interval}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex justify-center gap-4 text-sm text-muted-foreground">
                    <span>{plan.member_limit} members</span>
                    <span className="text-border">•</span>
                    <span>{plan.storage_gb}GB storage</span>
                  </div>
                </div>

                <div className="border-t border-border/50 pt-6 mb-6">
                  <ul className="space-y-3">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-3 text-sm">
                        <Check className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                        <span className="text-muted-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <Button
                  asChild
                  className={cn(
                    "w-full h-12 font-semibold",
                    isPopular
                      ? "shadow-lg shadow-primary/25"
                      : ""
                  )}
                  variant={isPopular ? "default" : "outline"}
                >
                  <Link href="/signup">
                    {plan.amount === 0 ? "Start Free" : "Get Started"}
                  </Link>
                </Button>
              </div>
            )
          })}
        </div>

        <div className="mt-12 text-center">
          <p className="text-sm text-muted-foreground">
            All prices are in Nigerian Naira (₦). Pay with card, bank transfer, or mobile money.
          </p>
        </div>
      </div>
    </section>
  )
}
