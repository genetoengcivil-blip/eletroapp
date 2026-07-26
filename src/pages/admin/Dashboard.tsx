import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { Card } from '../../components/ui/Card'

interface StatCardProps { label: string; value: number; color: string; icon: React.ReactNode }

function BarChart({ data, title }: { data: { label: string; value: number; color: string }[]; title: string }) {
  const max = Math.max(...data.map((d) => d.value), 1)
  return (
    <Card>
      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">{title}</h3>
      <div className="space-y-3">
        {data.map((item) => (
          <div key={item.label}>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-gray-600 dark:text-gray-400">{item.label}</span>
              <span className="font-semibold text-gray-800 dark:text-gray-200">{item.value}</span>
            </div>
            <div className="w-full glass-input rounded-full h-2 !p-0 !border-0" style={{ background: 'rgba(0,0,0,0.06)' }}>
              <div
                className="h-2 rounded-full transition-all duration-500"
                style={{ width: `${(item.value / max) * 100}%`, background: item.color }}
              />
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}

function DonutChart({ data, title }: { data: { label: string; value: number; color: string }[]; title: string }) {
  const total = data.reduce((a, b) => a + b.value, 0)
  let offset = 0
  const circles = data.map((item) => {
    const pct = total > 0 ? (item.value / total) * 100 : 0
    const circle = (
      <circle
        key={item.label}
        cx="20" cy="20" r="15"
        fill="none"
        stroke={item.color}
        strokeWidth="5"
        strokeDasharray={`${pct} ${100 - pct}`}
        strokeDashoffset={-offset}
        style={{ transition: 'stroke-dasharray 0.5s ease' }}
      />
    )
    offset += pct
    return circle
  })
  return (
    <Card>
      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">{title}</h3>
      <div className="flex items-center gap-4">
        <svg width="40" height="40" viewBox="0 0 40 40">
          {circles}
        </svg>
        <div className="space-y-2 flex-1">
          {data.map((item) => (
            <div key={item.label} className="flex items-center gap-2 text-xs">
              <div className="w-2.5 h-2.5 rounded-full" style={{ background: item.color }} />
              <span className="text-gray-600 dark:text-gray-400 flex-1">{item.label}</span>
              <span className="font-semibold text-gray-800 dark:text-gray-200">{item.value}</span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  )
}

export function AdminDashboard() {
  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState({ total: 0, admins: 0, subscribers: 0, users: 0 })
  const [stations, setStations] = useState({ total: 0, active: 0, pending: 0, inactive: 0 })
  const [subscriptions, setSubscriptions] = useState({ total: 0, active: 0, byPlan: [] as { name: string; count: number }[] })
  const [reviews, setReviews] = useState({ total: 0, avg: 0 })
  const [recentUsers, setRecentUsers] = useState<{ full_name: string; role: string; created_at: string }[]>([])
  const [recentStations, setRecentStations] = useState<{ name: string; city: string; created_at: string }[]>([])

  useEffect(() => { fetchStats() }, [])

  const fetchStats = async () => {
    const [
      { count: totalUsers },
      { data: userData },
      { count: totalStations },
      { count: activeStations },
      { count: pendingStations },
      { count: inactiveStations },
      { data: subData },
      { count: totalReviews },
      { data: allReviews },
      { data: recentU },
      { data: recentS },
    ] = await Promise.all([
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase.from('profiles').select('role, full_name, created_at').order('created_at', { ascending: false }).limit(5),
      supabase.from('charging_stations').select('id', { count: 'exact', head: true }),
      supabase.from('charging_stations').select('id', { count: 'exact', head: true }).eq('is_active', true).eq('is_approved', true),
      supabase.from('charging_stations').select('id', { count: 'exact', head: true }).eq('is_approved', false),
      supabase.from('charging_stations').select('id', { count: 'exact', head: true }).eq('is_active', false),
      supabase.from('subscriptions').select('*, plan:subscription_plans(name)').eq('status', 'active'),
      supabase.from('reviews').select('id', { count: 'exact', head: true }),
      supabase.from('reviews').select('rating'),
      supabase.from('profiles').select('full_name, role, created_at').order('created_at', { ascending: false }).limit(5),
      supabase.from('charging_stations').select('name, city, created_at').order('created_at', { ascending: false }).limit(5),
    ])

    const roleCount = { admins: 0, subscribers: 0, users: 0 }
    userData?.forEach((u: { role: string }) => {
      if (u.role === 'admin') roleCount.admins++
      else if (u.role === 'subscriber') roleCount.subscribers++
      else roleCount.users++
    })

    const planCount: Record<string, number> = {}
    subData?.forEach((s: { plan?: { name: string } }) => {
      if (s.plan?.name) planCount[s.plan.name] = (planCount[s.plan.name] || 0) + 1
    })
    const byPlan = Object.entries(planCount).map(([name, count]) => ({ name, count }))

    const avgRating = allReviews && allReviews.length > 0
      ? (allReviews.reduce((a: number, r: { rating: number }) => a + r.rating, 0) / allReviews.length).toFixed(1)
      : '0'

    setUsers({ total: totalUsers || 0, ...roleCount })
    setStations({ total: totalStations || 0, active: activeStations || 0, pending: pendingStations || 0, inactive: inactiveStations || 0 })
    setSubscriptions({ total: subData?.length || 0, active: subData?.length || 0, byPlan })
    setReviews({ total: totalReviews || 0, avg: parseFloat(avgRating as string) })
    setRecentUsers(recentU as { full_name: string; role: string; created_at: string }[] || [])
    setRecentStations(recentS as { name: string; city: string; created_at: string }[] || [])
    setLoading(false)
  }

  if (loading) return     <div className="p-6 text-center text-gray-500 dark:text-gray-400">Carregando...</div>

  const statCards: StatCardProps[] = [
    {
      label: 'Total de Usuários', value: users.total, color: '#3b82f6',
      icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    },
    {
      label: 'Eletropostos Ativos', value: stations.active, color: '#10b981',
      icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
    },
    {
      label: 'Pendentes', value: stations.pending, color: '#f59e0b',
      icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    },
    {
      label: 'Assinaturas Ativas', value: subscriptions.active, color: '#8b5cf6',
      icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
    },
    {
      label: 'Avaliações', value: reviews.total, color: '#ec4899',
      icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
    },
    {
      label: 'Nota Média', value: reviews.avg, color: '#f97316',
      icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
    },
  ]

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Painel Administrativo</h1>

      {/* Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        {statCards.map((s) => (
          <Card key={s.label} className="!p-4">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-2" style={{ background: s.color + '20' }}>
              <svg className="w-4 h-4" style={{ color: s.color }} fill="none" stroke="currentColor" viewBox="0 0 24 24">{s.icon}</svg>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">{s.label}</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">{s.value}</p>
          </Card>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
        <BarChart
          title="Usuários por Perfil"
          data={[
            { label: 'Usuários', value: users.users, color: '#3b82f6' },
            { label: 'Assinantes', value: users.subscribers, color: '#8b5cf6' },
            { label: 'Admins', value: users.admins, color: '#ef4444' },
          ]}
        />
        <BarChart
          title="Eletropostos por Status"
          data={[
            { label: 'Ativos', value: stations.active, color: '#10b981' },
            { label: 'Pendentes', value: stations.pending, color: '#f59e0b' },
            { label: 'Inativos', value: stations.inactive, color: '#6b7280' },
          ]}
        />
        <DonutChart
          title="Assinaturas por Plano"
          data={subscriptions.byPlan.length > 0
            ? subscriptions.byPlan.map((p, i) => ({ label: p.name, value: p.count, color: ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b'][i % 4] }))
            : [{ label: 'Nenhuma', value: 1, color: '#e5e7eb' }]
          }
        />
      </div>

      {/* Recent activity */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Últimos Usuários</h3>
          <div className="space-y-3">
            {recentUsers.map((u, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b dark:border-gray-700 last:border-0">
                <div>
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{u.full_name}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    u.role === 'admin' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : u.role === 'subscriber' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                  }`}>{u.role}</span>
                </div>
                <span className="text-xs text-gray-400 dark:text-gray-500">{new Date(u.created_at).toLocaleDateString('pt-BR')}</span>
              </div>
            ))}
            {recentUsers.length === 0 && <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-4">Nenhum usuário ainda</p>}
          </div>
        </Card>
        <Card>
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Últimos Eletropostos</h3>
          <div className="space-y-3">
            {recentStations.map((s, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b dark:border-gray-700 last:border-0">
                <div>
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{s.name}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">{s.city}</p>
                </div>
                <span className="text-xs text-gray-400 dark:text-gray-500">{new Date(s.created_at).toLocaleDateString('pt-BR')}</span>
              </div>
            ))}
            {recentStations.length === 0 && <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-4">Nenhum eletroposto ainda</p>}
          </div>
        </Card>
      </div>
    </div>
  )
}