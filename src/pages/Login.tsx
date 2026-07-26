import { useState, useEffect } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { addAccount } from '../lib/accounts'
import { useAuth } from '../hooks/useAuth'

export function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [waitingAuth, setWaitingAuth] = useState(false)
  const navigate = useNavigate()
  const { user, profile, loading: authLoading } = useAuth()

  useEffect(() => {
    if (waitingAuth && !authLoading && user && profile) {
      addAccount(user.email!, profile.full_name || user.email!, profile.role)
      switch (profile.role) {
        case 'admin': navigate('/admin'); break
        case 'subscriber': navigate('/subscriber'); break
        default: navigate('/dashboard')
      }
    }
  }, [waitingAuth, authLoading, user, profile, navigate])

  useEffect(() => {
    if (!waitingAuth || !user) return
    const timeout = setTimeout(async () => {
      if (user && !profile) {
        const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
        if (data) {
          addAccount(user.email!, data.full_name || user.email!, data.role)
          switch (data.role) {
            case 'admin': navigate('/admin'); break
            case 'subscriber': navigate('/subscriber'); break
            default: navigate('/dashboard')
          }
        }
      }
    }, 5000)
    return () => clearTimeout(timeout)
  }, [waitingAuth, user, profile, navigate])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    setWaitingAuth(false)

    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }

    setWaitingAuth(true)
  }

  return (
    <div className="min-h-screen flex relative overflow-hidden bg-gray-50 dark:bg-gray-900">
      {/* Left panel - branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-900 relative items-center justify-center">
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-72 h-72 bg-cyan-400/10 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-blue-300/8 rounded-full blur-3xl" />
        </div>
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '32px 32px' }} />
        <div className="relative z-10 text-center px-12 max-w-lg">
          <div className="w-20 h-20 bg-white/10 backdrop-blur-md rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h2 className="text-4xl font-extrabold text-white mb-4 tracking-tight">EletroApp</h2>
          <p className="text-blue-100/70 text-lg leading-relaxed">
            Encontre eletropostos por todo o Brasil. Planeje rotas, avalie estações e nunca fique sem carga.
          </p>
          <div className="mt-10 flex items-center justify-center gap-8">
            <div className="text-center">
              <p className="text-3xl font-extrabold text-white">857+</p>
              <p className="text-sm text-blue-200/60">Eletropostos</p>
            </div>
            <div className="w-px h-10 bg-white/20" />
            <div className="text-center">
              <p className="text-3xl font-extrabold text-white">27</p>
              <p className="text-sm text-blue-200/60">Estados</p>
            </div>
            <div className="w-px h-10 bg-white/20" />
            <div className="text-center">
              <p className="text-3xl font-extrabold text-white">75+</p>
              <p className="text-sm text-blue-200/60">Cidades</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right panel - form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 relative">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 right-20 w-96 h-96 bg-blue-500/3 rounded-full blur-3xl" />
          <div className="absolute bottom-20 left-20 w-80 h-80 bg-blue-400/2 rounded-full blur-3xl" />
        </div>

        <div className="w-full max-w-md relative">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <Link to="/" className="inline-flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-600/30">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <span className="text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight">EletroApp</span>
            </Link>
          </div>

          <div className="text-center mb-8">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">Bem-vindo de volta</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-2">Entre na sua conta para continuar</p>
          </div>

          <div className="glass-panel p-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 text-sm p-4 rounded-xl border border-red-100 dark:border-red-800/30 flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-800/30 flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Email</label>
                <input
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all dark:bg-gray-800/50 dark:text-white text-sm placeholder:text-gray-400"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Senha</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all dark:bg-gray-800/50 dark:text-white text-sm placeholder:text-gray-400"
                />
              </div>

              <button
                type="submit"
                disabled={loading || waitingAuth}
                className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-bold text-sm hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg shadow-blue-600/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {(loading || waitingAuth) && (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                )}
                {waitingAuth ? 'Entrando...' : 'Entrar'}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Não tem uma conta?{' '}
                <Link to="/register" className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-bold transition-colors">
                  Cadastre-se grátis
                </Link>
              </p>
            </div>
          </div>

          <p className="text-center mt-6 text-xs text-gray-400 dark:text-gray-500">
            Ao entrar, você concorda com os Termos de Uso e Política de Privacidade
          </p>
        </div>
      </div>
    </div>
  )
}
