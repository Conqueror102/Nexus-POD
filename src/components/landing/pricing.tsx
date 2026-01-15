"use client"

import { Button } from "@/components/ui/button"
import { Check, Star } from "lucide-react"
import { motion } from "framer-motion"

const plans = [
  {
    name: "Independent",
    price: "0",
    description: "Perfect for solo founders and freelancers.",
    features: ["1 Pod", "5 Projects", "500MB Storage", "Basic Offline Mode"],
    cta: "Start Free",
    popular: false
  },
  {
    name: "Founder",
    price: "29",
    description: "For growing teams that need more power.",
    features: ["5 Pods", "Unlimited Projects", "10GB Storage", "Priority Sync", "Advanced Analytics"],
    cta: "Get Started",
    popular: true
  },
  {
    name: "Empire",
    price: "99",
    description: "Scale without limits. Full enterprise control.",
    features: ["Unlimited Pods", "Unlimited Storage", "SAML SSO", "Dedicated Support", "Custom Contracts"],
    cta: "Contact Sales",
    popular: false
  }
]

export function Pricing() {
  return (
    <section id="pricing" className="py-24 sm:py-32 relative bg-vintage-green">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-20">
          <h2 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4 text-vintage-mint font-serif">Membership Tiers</h2>
          <p className="text-vintage-mint/60 text-lg max-w-2xl mx-auto font-light">
            Transparent pricing. Cancel anytime. No hidden fees.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className={`relative p-8 rounded-[2rem] border ${plan.popular ? 'border-vintage-amber bg-vintage-amber/5' : 'border-vintage-mint/10 bg-vintage-mint/[0.02]'} flex flex-col`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-vintage-amber text-vintage-green px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-lg shadow-vintage-amber/20 flex items-center gap-1">
                  <Star className="w-3 h-3 fill-current" />
                  Most Popular
                </div>
              )}
              
              <div className="mb-8">
                <h3 className={`text-xl font-bold mb-2 ${plan.popular ? 'text-vintage-amber' : 'text-vintage-mint'}`}>{plan.name}</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-vintage-mint">${plan.price}</span>
                  <span className="text-vintage-mint/60 text-sm">/month</span>
                </div>
                <p className="mt-4 text-vintage-mint/60 text-sm leading-relaxed">{plan.description}</p>
              </div>

              <ul className="space-y-4 mb-8 flex-1">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm text-vintage-mint/80">
                    <div className={`w-5 h-5 rounded-full ${plan.popular ? 'bg-vintage-amber/20 text-vintage-amber' : 'bg-vintage-mint/10 text-vintage-mint'} flex items-center justify-center flex-shrink-0`}>
                      <Check className="w-3 h-3" />
                    </div>
                    {feature}
                  </li>
                ))}
              </ul>

              <Button 
                variant={plan.popular ? "default" : "outline"} 
                className={`w-full h-12 rounded-xl font-bold text-base transition-all ${
                  plan.popular 
                    ? 'bg-vintage-amber text-vintage-green hover:bg-vintage-amber/90 shadow-lg shadow-vintage-amber/10' 
                    : 'border-vintage-mint/20 text-vintage-mint hover:bg-vintage-mint/5 hover:border-vintage-mint/50 hover:text-vintage-amber'
                }`}
              >
                {plan.cta}
              </Button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
