"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Hexagon, Loader2, Users } from "lucide-react"
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 p-4">
        <Card className="w-full max-w-md border-slate-800 bg-slate-900/80 backdrop-blur-xl">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center">
                <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
            </div>
            <CardTitle className="text-xl text-white">Invalid Invite</CardTitle>
            <CardDescription className="text-slate-400">{error}</CardDescription>
          </CardHeader>
          <CardFooter className="justify-center">
            <Link href="/">
              <Button variant="ghost" className="text-slate-400 hover:text-white">
                Go Home
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 p-4">
      <Card className="w-full max-w-md border-slate-800 bg-slate-900/80 backdrop-blur-xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="relative">
              <Hexagon className="w-16 h-16 text-emerald-500 fill-emerald-500/10" strokeWidth={1.5} />
              <span className="absolute inset-0 flex items-center justify-center text-emerald-400 font-bold text-xl">N</span>
            </div>
          </div>
          <CardTitle className="text-xl text-white">Join Pod</CardTitle>
          <CardDescription className="text-slate-400">
            You&apos;ve been invited to join a pod
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {invite && (
            <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                  <Users className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                  <p className="font-medium text-white">{invite.pods.title}</p>
                  <p className="text-sm text-slate-500">{invite.pods.npn}</p>
                </div>
              </div>
              {invite.pods.summary && (
                <p className="mt-3 text-sm text-slate-400">{invite.pods.summary}</p>
              )}
            </div>
          )}
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          {isLoggedIn ? (
            <Button onClick={handleJoin} disabled={joining} className="w-full bg-emerald-600 hover:bg-emerald-500">
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
                <Button className="w-full bg-emerald-600 hover:bg-emerald-500">
                  Create Account to Join
                </Button>
              </Link>
              <Link href={`/login?redirect=/join/${code}`} className="w-full">
                <Button variant="outline" className="w-full border-slate-700 text-slate-300">
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
