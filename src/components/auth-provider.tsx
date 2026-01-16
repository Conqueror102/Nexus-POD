"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"
import { createClient } from "@/lib/supabase/client"
import { db } from "@/lib/offline-db"
import type { Profile } from "@/lib/types"

interface AuthContextType {
  user: Profile | null
  loading: boolean
  isOffline: boolean
  signOut: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isOffline: false,
  signOut: async () => {},
  refreshUser: async () => {},
})

export function useAuth() {
  return useContext(AuthContext)
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [isOffline, setIsOffline] = useState(false)
  const supabase = createClient()

  async function loadCachedUserFirst() {
    try {
      const cachedUser = await db.cachedUser.get('current_user')
      if (cachedUser) {
        setUser(cachedUser)
      }
    } catch (e) {
      console.warn("Could not preload cached user:", e)
    }
  }

  async function fetchUser() {
    const online = typeof navigator !== 'undefined' ? navigator.onLine : true
    setIsOffline(!online)

    try {
      const cachedUser = await db.cachedUser.get('current_user')
      
      if (!online) {
        if (cachedUser) {
          setUser(cachedUser)
        }
        setLoading(false)
        return
      }
      
      const sessionPromise = supabase.auth.getSession()
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Session timeout')), 5000)
      )
      
      let session
      try {
        const result = await Promise.race([sessionPromise, timeoutPromise]) as { data: { session: any } }
        session = result.data.session
      } catch (timeoutError) {
        console.warn("Session fetch timed out, using cache")
        if (cachedUser) {
          setUser(cachedUser)
          setIsOffline(true)
        }
        setLoading(false)
        return
      }
      
      if (!session) {
        if (cachedUser) {
          setUser(cachedUser)
        } else {
          setUser(null)
        }
        setLoading(false)
        return
      }

      const authUser = session.user
      
      if (authUser) {
        try {
          const { data: profile } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", authUser.id)
            .single()
          
          if (profile) {
            setUser(profile)
            await db.cachedUser.put({ id: 'current_user', ...profile })
          } else {
            const newProfile = {
              id: authUser.id,
              email: authUser.email || "",
              display_name: authUser.user_metadata?.display_name || authUser.email?.split("@")[0] || "User",
            }
            try {
              await supabase.from("profiles").insert(newProfile)
              setUser(newProfile as Profile)
              await db.cachedUser.put({ id: 'current_user', ...newProfile })
            } catch (insertError) {
              console.warn("Could not create profile, using partial data:", insertError)
              setUser(newProfile as Profile)
              await db.cachedUser.put({ id: 'current_user', ...newProfile })
            }
          }
        } catch (profileError) {
          console.warn("Error fetching profile, checking cache:", profileError)
          if (cachedUser) {
            setUser(cachedUser)
          } else {
            const basicProfile: Profile = {
              id: authUser.id,
              email: authUser.email || "",
              display_name: authUser.user_metadata?.display_name || authUser.email?.split("@")[0] || "User",
            }
            setUser(basicProfile)
            await db.cachedUser.put({ id: 'current_user', ...basicProfile })
          }
        }
      } else {
        if (cachedUser) {
          setUser(cachedUser)
        } else {
          setUser(null)
        }
      }
    } catch (error) {
      console.warn("Error in fetchUser, trying cache:", error)
      setIsOffline(true)
      try {
        const cachedUser = await db.cachedUser.get('current_user')
        if (cachedUser) {
          setUser(cachedUser)
        } else {
          setUser(null)
        }
      } catch (cacheError) {
        console.warn("Could not load cached user:", cacheError)
        setUser(null)
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCachedUserFirst()
    fetchUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event) => {
      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        await fetchUser()
      } else if (event === "SIGNED_OUT") {
        setUser(null)
        await db.cachedUser.delete('current_user')
      }
    })

    function handleOnline() {
      setIsOffline(false)
      fetchUser()
    }
    function handleOffline() {
      setIsOffline(true)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      subscription.unsubscribe()
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  async function signOut() {
    try {
      await supabase.auth.signOut()
    } catch (error) {
      console.warn("Sign out error:", error)
    }
    setUser(null)
    await db.cachedUser.delete('current_user')
  }

  async function refreshUser() {
    await fetchUser()
  }

  return (
    <AuthContext.Provider value={{ user, loading, isOffline, signOut, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}
