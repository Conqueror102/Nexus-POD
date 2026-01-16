"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, Users, Folder, MessageSquare } from "lucide-react";

export function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse-glow" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-pulse-glow" style={{ animationDelay: "-2s" }} />
      
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-2 h-2 bg-primary/40 rounded-full animate-float" />
        <div className="absolute top-40 right-20 w-3 h-3 bg-primary/30 rounded-full animate-float-delayed" />
        <div className="absolute bottom-40 left-20 w-2 h-2 bg-primary/50 rounded-full animate-float" style={{ animationDelay: "-1s" }} />
        <div className="absolute bottom-20 right-40 w-4 h-4 bg-primary/20 rounded-full animate-float-delayed" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-sm font-medium text-primary mb-8 backdrop-blur-sm">
            <Sparkles className="w-4 h-4" />
            Built for African Founders & Teams
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold tracking-tight mb-6">
            <span className="bg-gradient-to-r from-foreground via-foreground to-foreground/70 bg-clip-text text-transparent">
              Your Team&apos;s
            </span>
            <br />
            <span className="bg-gradient-to-r from-primary via-primary to-primary/70 bg-clip-text text-transparent">
              Command Center
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            A lightweight, offline-first workspace for founders, creators, and small teams. 
            Manage projects, tasks, and team communication — all in one sleek platform.
            <span className="text-primary font-medium"> Budget-friendly in Naira.</span>
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Link href="/signup">
              <Button
                size="lg"
                className="h-14 px-8 text-base font-semibold bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-xl shadow-primary/25 hover:shadow-primary/40 transition-all group"
              >
                Start Free Trial
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link href="#features">
              <Button
                variant="outline"
                size="lg"
                className="h-14 px-8 text-base font-semibold border-border/50 hover:bg-muted/50"
              >
                See How It Works
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-3 gap-4 sm:gap-8 max-w-lg mx-auto">
            {[
              { icon: Users, label: "Team Pods", value: "Unlimited" },
              { icon: Folder, label: "Projects", value: "Organize" },
              { icon: MessageSquare, label: "Real-time", value: "Chat" },
            ].map((stat, idx) => (
              <div
                key={idx}
                className="flex flex-col items-center p-4 rounded-2xl bg-card/50 backdrop-blur-sm border border-border/50"
              >
                <stat.icon className="w-6 h-6 text-primary mb-2" />
                <span className="text-sm font-medium text-muted-foreground">{stat.label}</span>
                <span className="text-lg font-bold">{stat.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-20 relative">
          <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 via-primary/10 to-primary/20 rounded-3xl blur-2xl" />
          <div className="relative rounded-2xl overflow-hidden border border-border/50 bg-card/80 backdrop-blur-xl shadow-2xl">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-border/50 bg-muted/30">
              <div className="w-3 h-3 rounded-full bg-red-500/80" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
              <div className="w-3 h-3 rounded-full bg-green-500/80" />
              <span className="ml-4 text-xs text-muted-foreground font-mono">nexuspod.app/dashboard</span>
            </div>
            <div className="aspect-[16/9] bg-gradient-to-br from-background via-muted/20 to-background flex items-center justify-center">
              <div className="grid grid-cols-3 gap-4 p-8 w-full max-w-3xl">
                <div className="col-span-1 space-y-3">
                  <div className="h-8 bg-primary/20 rounded-lg animate-pulse" />
                  <div className="h-24 bg-muted/50 rounded-lg" />
                  <div className="h-24 bg-muted/50 rounded-lg" />
                  <div className="h-24 bg-muted/50 rounded-lg" />
                </div>
                <div className="col-span-2 space-y-3">
                  <div className="h-8 bg-muted/30 rounded-lg w-1/2" />
                  <div className="grid grid-cols-2 gap-3">
                    <div className="h-32 bg-card rounded-xl border border-border/50 p-4">
                      <div className="h-3 bg-primary/30 rounded w-1/2 mb-2" />
                      <div className="h-2 bg-muted/50 rounded w-3/4 mb-1" />
                      <div className="h-2 bg-muted/50 rounded w-1/2" />
                    </div>
                    <div className="h-32 bg-card rounded-xl border border-border/50 p-4">
                      <div className="h-3 bg-primary/30 rounded w-1/2 mb-2" />
                      <div className="h-2 bg-muted/50 rounded w-3/4 mb-1" />
                      <div className="h-2 bg-muted/50 rounded w-1/2" />
                    </div>
                    <div className="h-32 bg-card rounded-xl border border-border/50 p-4">
                      <div className="h-3 bg-primary/30 rounded w-1/2 mb-2" />
                      <div className="h-2 bg-muted/50 rounded w-3/4 mb-1" />
                      <div className="h-2 bg-muted/50 rounded w-1/2" />
                    </div>
                    <div className="h-32 bg-card rounded-xl border border-border/50 p-4">
                      <div className="h-3 bg-primary/30 rounded w-1/2 mb-2" />
                      <div className="h-2 bg-muted/50 rounded w-3/4 mb-1" />
                      <div className="h-2 bg-muted/50 rounded w-1/2" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
