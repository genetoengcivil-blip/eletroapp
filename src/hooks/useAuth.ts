import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuthContext } from '../components/auth/AuthProvider'
import { useAuthStore } from '../stores/authStore'

export function useAuth() {
  const { user, profile, loading } = useAuthContext()
  const navigate = useNavigate()
  const signOut = useAuthStore((s) => s.signOut)

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    return data
  }

  return { user, profile, loading, handleSignOut, fetchProfile }
}
