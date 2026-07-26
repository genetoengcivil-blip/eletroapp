import { create } from 'zustand'
import { supabase } from '../lib/supabase'

interface AuthState {
  signOut: () => Promise<void>
}

export const useAuthStore = create<AuthState>(() => ({
  signOut: async () => {
    await supabase.auth.signOut()
  },
}))
