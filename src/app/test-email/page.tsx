"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function TestEmailPage() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ success?: boolean; error?: string } | null>(null)

  async function sendTestEmail() {
    setLoading(true)
    setResult(null)
    try {
      const res = await fetch("/api/test-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: email }),
      })
      const data = await res.json()
      if (res.ok) {
        setResult({ success: true })
      } else {
        setResult({ error: data.error || "Failed to send" })
      }
    } catch (e) {
      setResult({ error: "Network error" })
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Test Email Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Button onClick={sendTestEmail} disabled={loading || !email}>
            {loading ? "Sending..." : "Send Test Email"}
          </Button>
          {result?.success && (
            <p className="text-green-600">Email sent successfully! Check your inbox.</p>
          )}
          {result?.error && (
            <p className="text-red-600">Error: {result.error}</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
