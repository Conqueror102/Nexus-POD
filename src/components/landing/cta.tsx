"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Zap } from "lucide-react";

export function CTA() {
  return (
    <section className="py-24 lg:py-32 relative">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent" />
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-3xl overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-primary/10 to-primary/5" />
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
          
          <div className="relative px-6 py-16 lg:px-16 lg:py-24">
            <div className="max-w-3xl mx-auto text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/20 backdrop-blur-sm mb-8">
                <Zap className="w-8 h-8 text-primary" />
              </div>
              
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6">
                Ready to Transform
                <br />
                <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                  How Your Team Works?
                </span>
              </h2>
              
              <p className="text-lg text-muted-foreground mb-10 max-w-xl mx-auto">
                Join thousands of African founders and teams already using Nexus Pod
                to ship faster and collaborate better.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href="/signup">
                  <Button
                    size="lg"
                    className="h-14 px-8 text-base font-semibold bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-xl shadow-primary/25 hover:shadow-primary/40 transition-all group"
                  >
                    Start Your Free Trial
                    <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <Link href="#pricing">
                  <Button
                    variant="outline"
                    size="lg"
                    className="h-14 px-8 text-base font-semibold border-border/50 bg-background/50 backdrop-blur-sm hover:bg-background/80"
                  >
                    View Pricing
                  </Button>
                </Link>
              </div>
              
              <p className="mt-6 text-sm text-muted-foreground">
                No credit card required • 14-day free trial • Cancel anytime
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
