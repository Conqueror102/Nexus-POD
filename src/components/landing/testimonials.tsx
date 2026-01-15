"use client"

import { Button } from "@/components/ui/button"
import { Quote } from "lucide-react"

export function Testimonials() {
  return (
    <section id="testimonials" className="py-24 sm:py-32 relative bg-vintage-green border-t border-vintage-mint/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="relative rounded-[3rem] p-12 sm:p-20 overflow-hidden text-center border border-vintage-mint/10 bg-vintage-mint/[0.02]">
          <div className="absolute top-10 left-10 text-vintage-mint/5">
            <Quote className="w-24 h-24 rotate-180" />
          </div>
          <div className="absolute bottom-10 right-10 text-vintage-mint/5">
            <Quote className="w-24 h-24" />
          </div>
          
          <div className="relative z-10 max-w-4xl mx-auto">
            <h2 className="text-3xl sm:text-5xl font-bold tracking-tight mb-8 text-vintage-mint font-serif italic">
              "We stopped using Linear and Notion. Nexus Pod is simply faster, cleaner, and the offline mode is a lifesaver for our remote team."
            </h2>
            <div className="flex items-center justify-center gap-4">
              <div className="w-12 h-12 rounded-full bg-vintage-amber/20 border border-vintage-amber/40" />
              <div className="text-left">
                <div className="text-vintage-amber font-bold">Sarah Jenkins</div>
                <div className="text-vintage-mint/60 text-sm">Founder @ Aether Labs</div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-24 text-center">
            <h2 className="text-3xl font-bold mb-8 text-vintage-mint">Ready to upgrade your workflow?</h2>
            <div className="flex justify-center gap-4">
                <Button size="lg" className="bg-vintage-amber text-vintage-green font-bold hover:bg-vintage-amber/90">
                    Get Started Free
                </Button>
            </div>
        </div>
      </div>
    </section>
  )
}
