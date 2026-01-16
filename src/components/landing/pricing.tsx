"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Check, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const plans = [
  {
    name: "Free",
    description: "Perfect for getting started",
    price: "₦0",
    period: "forever",
    features: [
      "1 Pod workspace",
      "Up to 3 team members",
      "5 projects per pod",
      "Basic task management",
      "500MB file storage",
      "Community support",
    ],
    cta: "Get Started",
    href: "/signup",
    popular: false,
  },
  {
    name: "Pro",
    description: "For growing teams",
    price: "₦5,000",
    period: "per month",
    features: [
      "Unlimited Pods",
      "Up to 10 team members per pod",
      "Unlimited projects",
      "Advanced task management",
      "5GB file storage",
      "Real-time chat",
      "Priority email support",
      "Export data (CSV, JSON)",
    ],
    cta: "Start Free Trial",
    href: "/signup?plan=pro",
    popular: true,
  },
  {
    name: "Business",
    description: "For established teams",
    price: "₦15,000",
    period: "per month",
    features: [
      "Everything in Pro",
      "Unlimited team members",
      "25GB file storage",
      "Admin dashboard",
      "Audit logs",
      "Custom branding",
      "API access",
      "Dedicated support",
    ],
    cta: "Contact Sales",
    href: "/signup?plan=business",
    popular: false,
  },
];

export function Pricing() {
  return (
    <section id="pricing" className="py-24 lg:py-32 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-muted/30 via-transparent to-muted/30" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16 lg:mb-20">
          <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            Pricing
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6">
            Simple, Transparent
            <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              {" "}
              Naira Pricing
            </span>
          </h2>
          <p className="text-lg text-muted-foreground">
            No hidden fees, no currency conversion headaches. Plans designed for
            African businesses.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto">
          {plans.map((plan, idx) => (
            <div
              key={idx}
              className={cn(
                "relative p-6 lg:p-8 rounded-2xl border transition-all duration-300",
                plan.popular
                  ? "bg-card border-primary/50 shadow-xl shadow-primary/10 scale-105 z-10"
                  : "bg-card/50 backdrop-blur-sm border-border/50 hover:border-primary/30"
              )}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-primary text-primary-foreground text-sm font-medium shadow-lg">
                    <Sparkles className="w-3.5 h-3.5" />
                    Most Popular
                  </span>
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-xl font-bold mb-1">{plan.name}</h3>
                <p className="text-sm text-muted-foreground">{plan.description}</p>
              </div>

              <div className="mb-6">
                <span className="text-4xl lg:text-5xl font-bold">{plan.price}</span>
                <span className="text-muted-foreground ml-2">/{plan.period}</span>
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, featureIdx) => (
                  <li key={featureIdx} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-3 h-3 text-primary" />
                    </div>
                    <span className="text-sm text-muted-foreground">{feature}</span>
                  </li>
                ))}
              </ul>

              <Link href={plan.href} className="block">
                <Button
                  className={cn(
                    "w-full h-12 font-semibold",
                    plan.popular
                      ? "bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg shadow-primary/25"
                      : ""
                  )}
                  variant={plan.popular ? "default" : "outline"}
                >
                  {plan.cta}
                </Button>
              </Link>
            </div>
          ))}
        </div>

        <div className="mt-16 text-center">
          <p className="text-muted-foreground">
            All plans include a{" "}
            <span className="text-foreground font-medium">14-day free trial</span>.
            No credit card required.
          </p>
        </div>
      </div>
    </section>
  );
}
