import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import type { ChargingStation } from '../../lib/types'
import { haversineDistance } from '../../lib/route'
import { getLoyaltyPoints, getLoyaltyLevel } from '../../lib/loyalty'
import { DashboardSkeleton } from '../../components/ui/Skeleton'

export function UserDashboard() {
  const { user, profile } = useAuth()
  const [totalStations, setTotalStations] = useState(0)
  const [favoriteCount, setFavoriteCount] = useState(0)
  const [reviewCount, setReviewCount] = useState(0)
  const [nearbyStations, setNearbyStations] = useState<ChargingStation[]>([])
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null)
  const [loading, setLoading] = useState(true)
  const [loyalty, setLoyalty] = useState<any>(null)

  const firstName = profile?.full_name?.split(' ')[0] || 'usuário'

  const powerColor = (kw: number): string => {
    if (kw >= 100) return '#dc2626'
    if (kw >= 50) return '#f59e0b'
    if (kw >= 22) return '#2563eb'
    return '#10b981'
  }

  useEffect(() => {
    fetchStats()
    fetchLoyalty()
    navigator.geolocation?.getCurrentPosition(
      (pos) => setUserLocation([pos.coords.latitude, pos.coords.longitude]),
      () => {}
    )
  }, [])

  const fetchLoyalty = async () => {
    if (!user) return
    const data = await getLoyaltyPoints(user.id)
    setLoyalty(data)
  }

  useEffect(() => {
    if (userLocation) fetchNearby()
  }, [userLocation])

  const fetchStats = async () => {
    const [stationsRes, favsRes, reviewsRes] = await Promise.all([
      supabase.from('charging_stations').select('id', { count: 'exact', head: true }).eq('is_active', true).eq('is_approved', true),
      user ? supabase.from('favorites').select('id', { count: 'exact', head: true }).eq('user_id', user.id) : { count: 0 },
      user ? supabase.from('reviews').select('id', { count: 'exact', head: true }).eq('user_id', user.id) : { count: 0 },
    ])
    setTotalStations(stationsRes.count || 0)
    setFavoriteCount(favsRes.count || 0)
    setReviewCount(reviewsRes.count || 0)
    setLoading(false)
  }

  const fetchNearby = async () => {
    const { data } = await supabase
      .from('charging_stations')
      .select('*')
      .eq('is_active', true)
      .eq('is_approved', true)
      .limit(50)
    if (data && userLocation) {
      const sorted = (data as ChargingStation[])
        .map((s) => ({ ...s, _dist: haversineDistance({ lat: userLocation[0], lng: userLocation[1] }, { lat: s.latitude, lng: s.longitude }) }))
        .sort((a: any, b: any) => a._dist - b._dist)
        .slice(0, 6) as ChargingStation[]
      setNearbyStations(sorted)
    }
  }

  const stats = [
    { label: 'Eletropostos', value: totalStations, icon: 'M13 10V3L4 14h7v7l9-11h-7z', gradient: 'from-blue-500 to-blue-600', link: '/eletropostos' },
    { label: 'Favoritos', value: favoriteCount, icon: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z', gradient: 'from-pink-500 to-rose-500', link: '/dashboard/favorites' },
    { label: 'Avaliações', value: reviewCount, icon: 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z', gradient: 'from-amber-500 to-orange-500', link: '/dashboard/reviews' },
  ]

  const quickActions = [
    { label: 'Planejar Viagem', desc: 'Calcule sua rota e paradas', icon: 'M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7', link: '/dashboard/trip-planner', bg: 'bg-blue-600 hover:bg-blue-700' },
    { label: 'Eletropostos', desc: 'Encontre no mapa', icon: 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z', link: '/eletropostos', bg: 'bg-emerald-600 hover:bg-emerald-700' },
    { label: 'Marketplace', desc: 'Compare carros EV', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4', link: '/dashboard/marketplace', bg: 'bg-violet-600 hover:bg-violet-700' },
  ]

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto">
      {loading ? <DashboardSkeleton /> : (
      <>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
          Olá, <span className="text-blue-600 dark:text-blue-400">{firstName}</span>
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1.5">Bem-vindo de volta! Aqui está um resumo da sua conta.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {stats.map((s) => (
          <Link key={s.label} to={s.link}
            className="relative overflow-hidden rounded-2xl p-5 text-white hover:shadow-xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] group">
            <div className={`absolute inset-0 bg-gradient-to-br ${s.gradient}`} />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors" />
            <div className="relative flex items-center justify-between">
              <div>
                <p className="text-sm font-medium opacity-80">{s.label}</p>
                <p className="text-3xl font-extrabold mt-1 tracking-tight">{loading ? '...' : s.value}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-white/15 flex items-center justify-center group-hover:bg-white/25 transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={s.icon} />
                </svg>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 tracking-tight">Ações Rápidas</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {quickActions.map((a) => (
            <Link key={a.label} to={a.link}
              className={`${a.bg} text-white rounded-2xl p-4 flex items-center gap-3.5 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] shadow-md hover:shadow-lg group`}>
              <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center flex-shrink-0 group-hover:bg-white/25 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={a.icon} />
                </svg>
              </div>
              <div>
                <p className="text-sm font-bold">{a.label}</p>
                <p className="text-[11px] opacity-75">{a.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Loyalty Card */}
      {loyalty && loyalty.totalPoints > 0 && (() => {
        const level = getLoyaltyLevel(loyalty.totalPoints)
        const progress = level.nextLevel > 0 ? (loyalty.totalPoints / level.nextLevel) * 100 : 100
        return (
          <div className="mb-8 glass-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white tracking-tight">Programa de Fidelidade</h2>
              <span className="text-xs font-bold px-3 py-1 rounded-full" style={{ background: `${level.color}15`, color: level.color }}>
                {level.name}
              </span>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-center">
                <div className="text-3xl font-extrabold" style={{ color: level.color }}>{loyalty.totalPoints}</div>
                <div className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">pontos</div>
              </div>
              <div className="flex-1">
                <div className="flex justify-between text-[10px] text-gray-400 mb-1.5">
                  <span className="font-medium">{level.name}</span>
                  {level.nextLevel > 0 && <span>Próximo: {level.nextLevel} pts</span>}
                </div>
                <div className="h-2.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-700" style={{ width: `${Math.min(progress, 100)}%`, background: `linear-gradient(90deg, ${level.color}, ${level.color}dd)` }} />
                </div>
                <div className="flex justify-between mt-2.5 text-[10px] text-gray-400">
                  <span>{loyalty.tripsCompleted} viagens</span>
                  <span>{loyalty.stationsVisited?.length || 0} estações visitadas</span>
                </div>
              </div>
            </div>
          </div>
        )
      })()}

      {/* Nearby Stations */}
      {nearbyStations.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white tracking-tight">Eletropostos Próximos</h2>
            <Link to="/eletropostos" className="text-sm text-blue-600 dark:text-blue-400 font-semibold hover:underline">Ver todos</Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {nearbyStations.map((station) => (
              <Link key={station.id} to={`/dashboard/station/${station.id}`}
                className="glass-card p-4 hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 group">
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform" style={{ background: `${powerColor(station.power_kw)}12` }}>
                    <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: powerColor(station.power_kw) }}>
                      <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-bold text-sm text-gray-900 dark:text-white truncate">{station.name}</h3>
                      {station.subscriber_id && (
                        <span className="text-[8px] bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded font-bold flex-shrink-0">PARCEIRO</span>
                      )}
                    </div>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">{station.city} - {station.state}</p>
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <span className="text-[10px] font-bold" style={{ color: powerColor(station.power_kw) }}>{station.power_kw}kW</span>
                      {userLocation && (
                        <span className="text-[10px] text-gray-400">
                          {(() => {
                            const d = haversineDistance({ lat: userLocation[0], lng: userLocation[1] }, { lat: station.latitude, lng: station.longitude })
                            return d < 1 ? `${Math.round(d * 1000)}m` : `${d.toFixed(1)}km`
                          })()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
      </>
      )}
    </div>
  )
}
