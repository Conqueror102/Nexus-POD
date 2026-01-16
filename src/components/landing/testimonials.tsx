"use client";

import { Star } from "lucide-react";

const testimonials = [
  {
    name: "Chidi Okonkwo",
    role: "Founder, TechLagos",
    content:
      "Nexus Pod has transformed how our remote team collaborates. The offline-first approach is a game-changer for working across different African cities with inconsistent internet.",
    avatar: "CO",
    rating: 5,
  },
  {
    name: "Amara Nwosu",
    role: "Product Lead, FinStack",
    content:
      "Finally, a workspace tool that understands our needs. The Naira pricing makes budgeting straightforward, and the interface is incredibly intuitive.",
    avatar: "AN",
    rating: 5,
  },
  {
    name: "Kwame Asante",
    role: "CTO, GhanaDevs",
    content:
      "We switched from expensive international tools and haven't looked back. Nexus Pod gives us everything we need at a fraction of the cost.",
    avatar: "KA",
    rating: 5,
  },
  {
    name: "Fatima Ibrahim",
    role: "Operations Manager, NaijaStartup",
    content:
      "The task management and team chat features keep everyone aligned. It's become the central hub for our entire operation.",
    avatar: "FI",
    rating: 5,
  },
  {
    name: "Oluwaseun Adeyemi",
    role: "Freelance Developer",
    content:
      "As a solo developer managing multiple client projects, Nexus Pod keeps me organized. The free tier is genuinely useful, not a stripped-down demo.",
    avatar: "OA",
    rating: 5,
  },
  {
    name: "Zainab Mohammed",
    role: "Creative Director, DesignHub",
    content:
      "Beautiful interface, fast performance, and excellent file management. Our design team loves using it for project collaboration.",
    avatar: "ZM",
    rating: 5,
  },
];

export function Testimonials() {
  return (
    <section id="testimonials" className="py-24 lg:py-32 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16 lg:mb-20">
          <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            Testimonials
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6">
            Loved by Teams
            <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              {" "}
              Across Africa
            </span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Join thousands of founders and teams who&apos;ve made Nexus Pod their workspace of choice.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {testimonials.map((testimonial, idx) => (
            <div
              key={idx}
              className="group relative p-6 lg:p-8 rounded-2xl bg-card/50 backdrop-blur-sm border border-border/50 hover:border-primary/30 transition-all duration-300"
            >
              <div className="flex items-center gap-1 mb-4">
                {Array.from({ length: testimonial.rating }).map((_, i) => (
                  <Star
                    key={i}
                    className="w-4 h-4 fill-primary text-primary"
                  />
                ))}
              </div>

              <p className="text-muted-foreground mb-6 leading-relaxed">
                &ldquo;{testimonial.content}&rdquo;
              </p>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-primary-foreground text-sm font-bold">
                  {testimonial.avatar}
                </div>
                <div>
                  <p className="font-semibold text-sm">{testimonial.name}</p>
                  <p className="text-xs text-muted-foreground">{testimonial.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
