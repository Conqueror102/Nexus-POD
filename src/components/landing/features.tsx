"use client";

import {
  Users,
  FolderKanban,
  MessageSquare,
  Wifi,
  Shield,
  Zap,
  Bell,
  FileText,
  Globe,
} from "lucide-react";

const features = [
  {
    icon: Users,
    title: "Team Pods",
    description:
      "Create dedicated workspaces for your teams. Invite members, assign roles, and collaborate seamlessly.",
  },
  {
    icon: FolderKanban,
    title: "Project Management",
    description:
      "Organize work into projects with tasks, due dates, priorities, and status tracking. Stay on top of deadlines.",
  },
  {
    icon: MessageSquare,
    title: "Real-time Chat",
    description:
      "Built-in team messaging with task comments. Keep conversations contextual and organized.",
  },
  {
    icon: Wifi,
    title: "Offline-First",
    description:
      "Works even without internet. Your data syncs automatically when you're back online. Perfect for African networks.",
  },
  {
    icon: Shield,
    title: "Secure & Private",
    description:
      "Enterprise-grade security with row-level permissions. Your data stays yours.",
  },
  {
    icon: Zap,
    title: "Lightning Fast",
    description:
      "Optimized for speed. No bloat, no unnecessary features — just what you need to get work done.",
  },
  {
    icon: Bell,
    title: "Smart Notifications",
    description:
      "Email reminders for upcoming tasks. Never miss a deadline with intelligent alerts.",
  },
  {
    icon: FileText,
    title: "File Management",
    description:
      "Upload, organize, and share files within your pods. Preview documents right in the app.",
  },
  {
    icon: Globe,
    title: "Naira Pricing",
    description:
      "Budget-friendly plans priced in Naira. Built specifically for the African market.",
  },
];

export function Features() {
  return (
    <section id="features" className="py-24 lg:py-32 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-muted/30 to-transparent" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16 lg:mb-20">
          <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            Features
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6">
            Everything You Need to
            <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              {" "}
              Ship Faster
            </span>
          </h2>
          <p className="text-lg text-muted-foreground">
            A complete workspace solution designed for speed, simplicity, and the
            realities of working in Africa.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {features.map((feature, idx) => (
            <div
              key={idx}
              className="group relative p-6 lg:p-8 rounded-2xl bg-card/50 backdrop-blur-sm border border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-xl hover:shadow-primary/5"
            >
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              
              <div className="relative">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-5 group-hover:bg-primary/20 transition-colors">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
