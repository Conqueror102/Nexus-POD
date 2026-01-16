import { Quote, Star } from "lucide-react"

const testimonials = [
  {
    name: "Adaeze Okonkwo",
    role: "Founder, TechStart Lagos",
    content: "Finally, a tool that understands African founders. The offline mode has been a lifesaver during our frequent power outages. Our team productivity increased by 40%.",
    avatar: "AO",
    rating: 5,
  },
  {
    name: "Kwame Asante",
    role: "CEO, GhanaDevs",
    content: "We switched from Slack and Notion to Nexus Pod and cut our software costs by 70%. The Naira pricing means no more dollar headaches.",
    avatar: "KA",
    rating: 5,
  },
  {
    name: "Fatima Ibrahim",
    role: "Product Lead, Fintech Hub",
    content: "The simplicity is refreshing. No bloated features, just what we need. Our remote team across Nigeria and Kenya uses it daily.",
    avatar: "FI",
    rating: 5,
  },
  {
    name: "David Mensah",
    role: "Co-founder, AgroTech Solutions",
    content: "As a startup, every naira counts. Nexus Pod gives us enterprise features at a price we can actually afford. Best decision we made.",
    avatar: "DM",
    rating: 5,
  },
  {
    name: "Amina Yusuf",
    role: "Team Lead, Creative Studios",
    content: "The file storage and team chat in one place is exactly what we needed. No more switching between apps. Clean, fast, and reliable.",
    avatar: "AY",
    rating: 5,
  },
  {
    name: "Chidi Eze",
    role: "CTO, HealthTech Africa",
    content: "Security was our main concern. Nexus Pod's role-based access and data encryption gave us the confidence to migrate our entire team.",
    avatar: "CE",
    rating: 5,
  },
]

export function TestimonialsSection() {
  return (
    <section id="testimonials" className="relative py-24 md:py-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16 md:mb-20">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-6">
            <Star className="w-4 h-4 fill-primary" />
            <span>Loved by Teams</span>
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-6">
            Trusted by{" "}
            <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              African Innovators
            </span>
          </h2>
          <p className="text-lg text-muted-foreground">
            See what founders and teams across Africa are saying about Nexus Pod.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <div
              key={testimonial.name}
              className="group relative p-6 rounded-2xl bg-card/50 border border-border/50 hover:border-primary/30 hover:bg-card/80 transition-all duration-300"
            >
              <Quote className="absolute top-6 right-6 w-8 h-8 text-primary/10" />
              
              <div className="flex items-center gap-1 mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                ))}
              </div>

              <p className="text-muted-foreground mb-6 leading-relaxed">
                "{testimonial.content}"
              </p>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold text-sm">
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
  )
}
