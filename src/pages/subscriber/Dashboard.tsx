import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../stores/authStore'
import type { ChargingStation, Subscription } from '../../lib/types'
import { Card } from '../../components/ui/Card'

export function SubscriberDashboard() {
  const { user, profile } = useAuthStore()
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

  return (
    <div className="p-4 sm:p-6">
      <div className="flex items-center gap-4 mb-6">
        <div className="w-12 h-12 rounded-full glass-btn flex items-center justify-center text-white text-lg font-bold overflow-hidden flex-shrink-0">
          {profile?.avatar_url
            ? <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
            : profile?.full_name ? initials(profile.full_name) : '?'}
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Olá, {profile?.full_name?.split(' ')[0] || 'Parceiro'}!</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Painel de controle do seu negócio</p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Carregando...</div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
            <Card className="!p-4 sm:!p-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Total</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stations.length}</p>
                </div>
              </div>
            </Card>
            <Card className="!p-4 sm:!p-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Ativos</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">{activeStations}</p>
                </div>
              </div>
            </Card>
            <Card className="!p-4 sm:!p-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center text-yellow-600 dark:text-yellow-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Pendentes</p>
                  <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{pendingStations}</p>
                </div>
              </div>
            </Card>
            <Card className="!p-4 sm:!p-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Avaliação</p>
                  <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{avgRating > 0 ? avgRating.toFixed(1) : '—'}</p>
                  <p className="text-[10px] text-gray-400">{totalReviews} avaliações</p>
                </div>
              </div>
            </Card>
          </div>

          {subscription && (
            <Card className="mb-6 !p-4 sm:!p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">Plano {subscription.plan?.name}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Até {subscription.plan?.max_stations} eletropostos • R${subscription.plan?.price}/mês
                  </p>
                </div>
                <span className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-sm px-3 py-1 rounded-full font-medium">
                  Ativo
                </span>
              </div>
            </Card>
          )}

          <Card title="Seus Eletropostos" subtitle={`${activeStations} aprovados, ${pendingStations} pendentes`} className="!p-4 sm:!p-6">
            {stations.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-sm py-4">Você ainda não cadastrou eletropostos</p>
            ) : (
              <div className="space-y-3 mt-4">
                {stations.map((station) => (
                  <div key={station.id} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    {station.image_url ? (
                      <img src={station.image_url} alt={station.name} className="w-14 h-14 rounded-lg object-cover flex-shrink-0" />
                    ) : (
                      <div className="w-14 h-14 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center flex-shrink-0">
                        <svg className="w-6 h-6 text-blue-300" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 dark:text-white truncate">{station.name}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{station.city} - {station.state}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">{station.power_kw}kW • {station.operating_hours}</p>
                    </div>
                    <span className={`text-xs px-3 py-1 rounded-full font-medium flex-shrink-0 ${
                      station.is_approved ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                    }`}>
                      {station.is_approved ? 'Aprovado' : 'Pendente'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  )
}
