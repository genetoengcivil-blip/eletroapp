import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import type { ChargingStation, Subscription } from '../../lib/types'

export function SubscriberDashboard() {
  const { user, profile } = useAuth()
  const [stations, setStations] = useState<ChargingStation[]>([])
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [totalReviews, setTotalReviews] = useState(0)
  const [avgRating, setAvgRating] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    if (!user) return
    const [stationsRes, subRes, reviewsRes] = await Promise.all([
      supabase.from('charging_stations').select('*').eq('subscriber_id', user.id),
      supabase.from('subscriptions').select('*, plan:subscription_plans(*)').eq('user_id', user.id).eq('status', 'active').single(),
      supabase.from('reviews').select('rating, station:charging_stations!inner(subscriber_id)').eq('charging_stations.subscriber_id', user.id),
    ])
    if (stationsRes.data) setStations(stationsRes.data)
    if (subRes.data) setSubscription(subRes.data as any)
    if (reviewsRes.data) {
      setTotalReviews(reviewsRes.data.length)
      const avg = reviewsRes.data.length ? reviewsRes.data.reduce((acc, r) => acc + r.rating, 0) / reviewsRes.data.length : 0
      setAvgRating(avg)
    }
    setLoading(false)
  }

  const activeStations = stations.filter(s => s.is_active && s.is_approved).length
  const pendingStations = stations.filter(s => !s.is_approved).length

  const initials = (name: string) => name.split(' ').filter(Boolean).map(n => n[0]).join('').substring(0, 2).toUpperCase()

  const statCards = [
    { label: 'Total', value: stations.length, icon: 'M13 10V3L4 14h7v7l9-11h-7z', bg: 'bg-blue-50 dark:bg-blue-900/30', text: 'text-blue-600 dark:text-blue-400' },
    { label: 'Ativos', value: activeStations, icon: 'M5 13l4 4L19 7', bg: 'bg-emerald-50 dark:bg-emerald-900/30', text: 'text-emerald-600 dark:text-emerald-400' },
    { label: 'Pendentes', value: pendingStations, icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z', bg: 'bg-amber-50 dark:bg-amber-900/30', text: 'text-amber-600 dark:text-amber-400' },
    { label: 'Avaliação', value: avgRating > 0 ? avgRating.toFixed(1) : '—', icon: 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z', bg: 'bg-purple-50 dark:bg-purple-900/30', text: 'text-purple-600 dark:text-purple-400', sub: `${totalReviews} avaliações` },
  ]

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-lg font-bold overflow-hidden flex-shrink-0 shadow-lg shadow-blue-600/20">
          {profile?.avatar_url
            ? <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
            : profile?.full_name ? initials(profile.full_name) : '?'}
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            Olá, {profile?.full_name?.split(' ')[0] || 'Parceiro'}!
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Painel de controle do seu negócio</p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-16">
          <div className="w-10 h-10 border-4 border-blue-200 dark:border-blue-800 rounded-full mx-auto" />
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin -mt-14 mx-auto" />
        </div>
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
            {statCards.map((s) => (
              <div key={s.label} className="glass-card p-4 sm:p-5">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center ${s.text}`}>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={s.icon} />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">{s.label}</p>
                    <p className={`text-2xl font-extrabold tracking-tight ${s.text}`}>{s.value}</p>
                    {'sub' in s && s.sub && <p className="text-[10px] text-gray-400">{s.sub}</p>}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Subscription */}
          {subscription && (
            <div className="glass-card p-5 mb-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
                    <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white">Plano {subscription.plan?.name}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Até {subscription.plan?.max_stations} eletropostos • R${subscription.plan?.price}/mês
                    </p>
                  </div>
                </div>
                <span className="bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-sm px-4 py-1.5 rounded-full font-semibold">
                  Ativo
                </span>
              </div>
            </div>
          )}

          {/* Stations */}
          <div className="glass-card p-5 sm:p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white tracking-tight">Seus Eletropostos</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{activeStations} aprovados, {pendingStations} pendentes</p>
              </div>
              <Link to="/subscriber/stations" className="text-sm text-blue-600 dark:text-blue-400 font-semibold hover:underline">
                Gerenciar
              </Link>
            </div>
            {stations.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <svg className="w-8 h-8 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <p className="text-sm text-gray-400 font-medium">Você ainda não cadastrou eletropostos</p>
              </div>
            ) : (
              <div className="space-y-3">
                {stations.slice(0, 5).map((station) => (
                  <div key={station.id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                    {station.image_url ? (
                      <img src={station.image_url} alt={station.name} className="w-14 h-14 rounded-xl object-cover flex-shrink-0" />
                    ) : (
                      <div className="w-14 h-14 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center flex-shrink-0">
                        <svg className="w-6 h-6 text-blue-300" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-900 dark:text-white truncate text-sm">{station.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{station.city} - {station.state}</p>
                      <p className="text-[11px] text-gray-400 dark:text-gray-500">{station.power_kw}kW • {station.operating_hours}</p>
                    </div>
                    <span className={`text-xs px-3 py-1 rounded-full font-semibold flex-shrink-0 ${
                      station.is_approved ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' : 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
                    }`}>
                      {station.is_approved ? 'Aprovado' : 'Pendente'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
