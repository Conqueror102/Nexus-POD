import { createClient } from "@/lib/supabase/server"
import {
  Navbar,
  HeroSection,
  FeaturesSection,
  PricingSection,
  TestimonialsSection,
  FAQSection,
  CTASection,
  Footer,
} from "@/components/landing"

async function getPlans() {
  const supabase = await createClient()
  const { data: plans } = await supabase
    .from("system_plans")
    .select("*")
    .eq("is_active", true)
    .order("amount", { ascending: true })

  return plans || []
}

export default async function LandingPage() {
  const plans = await getPlans()

  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      <HeroSection />
      <FeaturesSection />
      <PricingSection plans={plans} />
      <TestimonialsSection />
      <FAQSection />
      <CTASection />
      <Footer />
    </main>
  )
}
