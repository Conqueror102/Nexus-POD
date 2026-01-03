"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Hexagon, Loader2, Users, X } from "lucide-react"
import Link from "next/link"

interface InviteData {
  id: string
  invite_code: string
  pods: {
    id: string
    title: string
    npn: string
    summary: string | null
  }
}

export default function JoinPage() {
  const router = useRouter()
  const params = useParams()
  const code = params.code as string
  const supabase = createClient()

  const [invite, setInvite] = useState<InviteData | null>(null)
  const [loading, setLoading] = useState(true)
  const [joining, setJoining] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    async function checkAuth() {
      const { data: { user } } = await supabase.auth.getUser()
      setIsLoggedIn(!!user)
    }
    checkAuth()
  }, [])

  useEffect(() => {
    async function fetchInvite() {
      const res = await fetch(`/api/join/${code}`)
      if (res.ok) {
        const data = await res.json()
        setInvite(data)
      } else {
        const err = await res.json()
        setError(err.error || "Invalid invite link")
      }
      setLoading(false)
    }
    fetchInvite()
  }, [code])

  async function handleJoin() {
    setJoining(true)
    
    const res = await fetch(`/api/join/${code}`, { method: "POST" })
    const data = await res.json()

    if (res.ok || res.status === 409) {
      router.push("/dashboard")
    } else {
      setError(data.error || "Failed to join pod")
      setJoining(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 -left-32 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        </div>
        <Card className="w-full max-w-md relative z-10">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
                <X className="w-8 h-8 text-destructive" />
              </div>
            </div>
            <CardTitle className="text-xl">Invalid Invite</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardFooter className="justify-center">
            <Link href="/">
              <Button variant="ghost">
                Go Home
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      </div>
      <Card className="w-full max-w-md relative z-10">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="relative">
              <Hexagon className="w-16 h-16 text-primary fill-primary/10" strokeWidth={1.5} />
              <span className="absolute inset-0 flex items-center justify-center text-primary font-bold text-xl">N</span>
            </div>
          </div>
          <CardTitle className="text-xl">Join Pod</CardTitle>
          <CardDescription>
            You&apos;ve been invited to join a pod
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {invite && (
            <div className="p-4 rounded-lg bg-muted border">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="font-medium">{invite.pods.title}</p>
                  <p className="text-sm text-muted-foreground">{invite.pods.npn}</p>
                </div>
              </div>
              {invite.pods.summary && (
                <p className="mt-3 text-sm text-muted-foreground">{invite.pods.summary}</p>
              )}
            </div>
          )}
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          {isLoggedIn ? (
            <Button onClick={handleJoin} disabled={joining} className="w-full">
              {joining ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Joining...
                </>
              ) : (
                "Join Pod"
              )}
            </Button>
          ) : (
            <>
              <Link href={`/signup?redirect=/join/${code}`} className="w-full">
                <Button className="w-full">
                  Create Account to Join
                </Button>
              </Link>
              <Link href={`/login?redirect=/join/${code}`} className="w-full">
                <Button variant="outline" className="w-full">
                  Login to Join
                </Button>
              </Link>
            </>
          )}
        </CardFooter>
      </Card>
    </div>
  )
}
