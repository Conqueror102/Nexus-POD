"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"
import { createClient } from "@/lib/supabase/client"
import { db } from "@/lib/offline-db"
import type { Profile } from "@/lib/types"

interface AuthContextType {
  user: Profile | null
  loading: boolean
  signOut: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signOut: async () => {},
  refreshUser: async () => {},
})

export function useAuth() {
  return useContext(AuthContext)
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  async function fetchUser() {
    try {
      // First try to load cached user
      const cachedUser = await db.cachedUser.get('current_user')
      
      // Try to get fresh session
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        // If no session but we have cached user, use it (offline mode)
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
            // Cache the user for offline access
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
              // Cache the new user
              await db.cachedUser.put({ id: 'current_user', ...newProfile })
            } catch (insertError) {
              console.warn("Could not create profile, using partial data:", insertError)
              setUser(newProfile as Profile)
              // Still cache it
              await db.cachedUser.put({ id: 'current_user', ...newProfile })
            }
          }
        } catch (profileError) {
          console.warn("Error fetching profile, checking cache:", profileError)
          // Try to use cached user if available
          if (cachedUser) {
            setUser(cachedUser)
          } else {
            // Otherwise use auth data
            const basicProfile: Profile = {
              id: authUser.id,
              email: authUser.email || "",
              display_name: authUser.user_metadata?.display_name || authUser.email?.split("@")[0] || "User",
            }
            setUser(basicProfile)
            // Cache this basic profile
            await db.cachedUser.put({ id: 'current_user', ...basicProfile })
          }
        }
      } else {
        // No auth user, use cached if available
        if (cachedUser) {
          setUser(cachedUser)
        } else {
          setUser(null)
        }
      }
    } catch (error) {
      console.warn("Error in fetchUser, trying cache:", error)
      // Try to load cached user as fallback
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
    fetchUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event) => {
      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        await fetchUser()
      } else if (event === "SIGNED_OUT") {
        setUser(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function signOut() {
    try {
      await supabase.auth.signOut()
    } catch (error) {
      console.warn("Sign out error:", error)
    }
    setUser(null)
  }

  async function refreshUser() {
    await fetchUser()
  }

  return (
    <AuthContext.Provider value={{ user, loading, signOut, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}
