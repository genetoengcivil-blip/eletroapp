import { useState, useRef, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { useThemeStore } from '../../stores/themeStore'
import { getStoredAccounts, removeAccount, type StoredAccount } from '../../lib/accounts'

export function Navbar() {
  const { user, profile, handleSignOut } = useAuth()
  const { dark, toggle } = useThemeStore()
  const [showSwitcher, setShowSwitcher] = useState(false)
  const [accounts, setAccounts] = useState<StoredAccount[]>([])
  const ref = useRef<HTMLDivElement>(null)
  const location = useLocation()
  const navigate = useNavigate()

  const isSubPage = location.pathname !== '/' && location.pathname !== '/login' && location.pathname !== '/register'

  useEffect(() => {
    setAccounts(getStoredAccounts())
    document.documentElement.classList.toggle('dark', dark)
  }, [user, dark])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setShowSwitcher(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const initials = (name: string) => name.split(' ').filter(Boolean).map(n => n[0]).join('').substring(0, 2).toUpperCase()

  return (
    <nav className="sticky top-0 z-50 glass-nav">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-14 sm:h-16 items-center">
          <div className="flex items-center gap-3">
            {isSubPage && (
              <button onClick={() => navigate(-1)}
                className="p-2 -ml-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 glass-btn rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <span className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">EletroApp</span>
            </Link>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Dark mode toggle */}
            <button onClick={toggle}
              className="p-2 rounded-xl glass-btn-secondary text-gray-600 dark:text-yellow-400"
              title={dark ? 'Modo claro' : 'Modo escuro'}>
              {dark ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>

            {user ? (
              <div className="flex items-center gap-2 sm:gap-3">
                {accounts.length > 1 && (
                  <div ref={ref} className="relative">
                    <button onClick={() => setShowSwitcher(!showSwitcher)}
                      className="flex items-center gap-2 px-2 py-1 rounded-lg transition-colors hover:bg-gray-100 dark:hover:bg-gray-800">
                      <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold overflow-hidden">
                        {profile?.avatar_url
                          ? <img src={profile.avatar_url} alt="avatar" className="w-full h-full object-cover" />
                          : profile?.full_name ? initials(profile.full_name) : '?'}
                      </div>
                      <svg className={`w-4 h-4 transition-transform text-gray-400 ${showSwitcher ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {showSwitcher && (
                      <div className="absolute right-0 mt-2 w-64 glass-panel z-50 overflow-hidden">
                        <div className="px-3 py-2 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
                          <p className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">Trocar conta</p>
                        </div>
                        <div className="max-h-64 overflow-y-auto">
                          {accounts.map((acc) => {
                            const isActive = acc.email === user.email
                            return (
                              <div key={acc.email} className={`flex items-center gap-3 px-3 py-2.5 ${isActive ? 'bg-blue-50 dark:bg-blue-900/30' : 'hover:bg-gray-50 dark:hover:bg-gray-700'} transition-colors`}>
                                <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ background: acc.avatar_color }}>
                                  {initials(acc.full_name)}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium truncate text-gray-900 dark:text-gray-100">{acc.full_name}</p>
                                  <p className="text-xs truncate text-gray-500 dark:text-gray-400">{acc.email}</p>
                                </div>
                                {isActive && <svg className="w-4 h-4 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>}
                                {!isActive && (
                                  <button onClick={(e) => { e.stopPropagation(); removeAccount(acc.email); setAccounts(getStoredAccounts()) }}
                                    className="flex-shrink-0 p-1 text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400" title="Remover">
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                  </button>
                                )}
                              </div>
                            )
                          })}
                        </div>
                        <div className="px-3 py-2 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
                          <p className="text-[10px] text-gray-400 dark:text-gray-500">Faça login em outra conta para adicionar</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Profile avatar + first name */}
                <div className="hidden sm:flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold overflow-hidden">
                    {profile?.avatar_url
                      ? <img src={profile.avatar_url} alt="avatar" className="w-full h-full object-cover" />
                      : profile?.full_name ? initials(profile.full_name) : '?'}
                  </div>
                  <span className="text-sm text-gray-600 dark:text-gray-400 max-w-[100px] truncate">{profile?.full_name?.split(' ')[0]}</span>
                </div>
                <button onClick={handleSignOut} className="text-sm text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors">
                  Sair
                </button>
              </div>
            ) : (
              <>
                <Link to="/login" className="text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Entrar</Link>
                <Link to="/register" className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors">Cadastrar</Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
