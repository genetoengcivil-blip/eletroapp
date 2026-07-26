import { createContext, useContext, useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import type { User } from '@supabase/supabase-js'
import type { Profile } from '../../lib/types'
import { supabase } from '../../lib/supabase'
import { useThemeStore } from '../../stores/themeStore'

interface AuthContextType {
  user: User | null
  profile: Profile | null
  loading: boolean
}

const AuthContext = createContext<AuthContextType>({ user: null, profile: null, loading: true })

export function useAuthContext() {
  return useContext(AuthContext)
}

async function fetchProfileWithRetry(userId: string, retries = 3): Promise<Profile | null> {
  for (let i = 0; i < retries; i++) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()
      if (data) return data
      if (error && i < retries - 1) {
        await new Promise(r => setTimeout(r, 300 * (i + 1)))
        continue
      }
      return data
    } catch {
      if (i < retries - 1) {
        await new Promise(r => setTimeout(r, 300 * (i + 1)))
        continue
      }
      return null
    }
  }
  return null
}

async function ensureProfile(user: User): Promise<Profile | null> {
  const profile = await fetchProfileWithRetry(user.id)
  if (profile) return profile
  try {
    const { data } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        email: user.email || '',
        full_name: user.user_metadata?.full_name || user.email || '',
        role: (user.user_metadata?.role as any) || 'user',
      }, { onConflict: 'id' })
      .select()
      .single()
    return data
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const dark = useThemeStore((s) => s.dark)
  const profileFetchingRef = useRef<string | null>(null)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
  }, [dark])

  const fetchAndSetProfile = async (u: User) => {
    if (profileFetchingRef.current === u.id) return
    profileFetchingRef.current = u.id
    try {
      const p = await ensureProfile(u)
      setProfile(p)
    } finally {
      profileFetchingRef.current = null
    }
  }

  useEffect(() => {
    let mounted = true

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!mounted) return
      const u = session?.user ?? null
      setUser(u)
      if (u) {
        await fetchAndSetProfile(u)
      }
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const u = session?.user ?? null
      setUser(u)
      if (u) {
        await fetchAndSetProfile(u)
      } else {
        setProfile(null)
      }
      setLoading(false)
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  return (
    <AuthContext.Provider value={{ user, profile, loading }}>
      {children}
    </AuthContext.Provider>
  )
}
