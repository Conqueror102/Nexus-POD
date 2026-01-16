"use client"

import { useState } from "react"
import { ChevronDown, HelpCircle } from "lucide-react"
import { cn } from "@/lib/utils"

const faqs = [
  {
    question: "Is there a free plan?",
    answer: "Yes! Our free plan includes up to 3 team members, 500MB storage, basic task management, and team chat. It's perfect for small teams getting started.",
  },
  {
    question: "How does offline mode work?",
    answer: "Nexus Pod stores your data locally on your device. When you're offline, you can continue working as normal. Once you're back online, your changes sync automatically with no data loss.",
  },
  {
    question: "What payment methods do you accept?",
    answer: "We accept card payments, bank transfers, and mobile money (including M-Pesa, Airtel Money, and more). All payments are processed securely through Paystack.",
  },
  {
    question: "Can I upgrade or downgrade my plan?",
    answer: "Absolutely! You can change your plan at any time. When upgrading, you'll be charged the prorated difference. When downgrading, the change takes effect at the end of your billing cycle.",
  },
  {
    question: "Is my data secure?",
    answer: "Yes, security is our priority. We use enterprise-grade encryption for all data, role-based access controls, and regular security audits. Your data is stored securely and never shared.",
  },
  {
    question: "Do you offer refunds?",
    answer: "We offer a 14-day money-back guarantee for all paid plans. If you're not satisfied, contact our support team and we'll process your refund.",
  },
  {
    question: "Can I invite team members from other countries?",
    answer: "Yes! Nexus Pod works globally. You can invite team members from anywhere in the world. The pricing is in Naira for convenience, but anyone can join your pod.",
  },
  {
    question: "How do I migrate from other tools?",
    answer: "We provide migration guides and import tools to help you move from popular platforms like Slack, Notion, and Trello. Our support team is also available to help with custom migrations.",
  },
]

export function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  return (
    <section id="faq" className="relative py-24 md:py-32 bg-muted/30">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-px bg-gradient-to-r from-transparent via-border to-transparent" />
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16 md:mb-20">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-6">
            <HelpCircle className="w-4 h-4" />
            <span>FAQ</span>
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-6">
            Frequently Asked{" "}
            <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Questions
            </span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Everything you need to know about Nexus Pod.
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className={cn(
                "rounded-xl border transition-all duration-300",
                openIndex === index
                  ? "bg-card border-primary/30 shadow-lg shadow-primary/5"
                  : "bg-card/50 border-border/50 hover:border-primary/20"
              )}
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full flex items-center justify-between p-5 text-left"
              >
                <span className="font-semibold pr-4">{faq.question}</span>
                <ChevronDown
                  className={cn(
                    "w-5 h-5 text-muted-foreground flex-shrink-0 transition-transform duration-300",
                    openIndex === index && "rotate-180 text-primary"
                  )}
                />
              </button>
              <div
                className={cn(
                  "overflow-hidden transition-all duration-300",
                  openIndex === index ? "max-h-96 pb-5" : "max-h-0"
                )}
              >
                <p className="px-5 text-muted-foreground leading-relaxed">
                  {faq.answer}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
