import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import type { ChargingStation } from '../../lib/types'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'

export function AdminStations() {
  const [stations, setStations] = useState<(ChargingStation & { subscriber?: { full_name: string } })[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved'>('all')
  const [filterState, setFilterState] = useState('')

  useEffect(() => {
    fetchStations()
  }, [])

  const fetchStations = async () => {
    const { data } = await supabase
      .from('charging_stations')
      .select('*, subscriber:profiles!charging_stations_subscriber_id_fkey(full_name)')
      .order('created_at', { ascending: false })
    if (data) setStations(data as any[])
    setLoading(false)
  }

  const approveStation = async (id: string) => {
    await supabase.from('charging_stations').update({ is_approved: true }).eq('id', id)
    fetchStations()
  }

  const rejectStation = async (id: string) => {
    await supabase.from('charging_stations').update({ is_active: false }).eq('id', id)
    fetchStations()
  }

  const toggleActive = async (id: string, current: boolean) => {
    await supabase.from('charging_stations').update({ is_active: !current }).eq('id', id)
    fetchStations()
  }

  const filteredStations = stations.filter((s) => {
    if (filter === 'pending' && s.is_approved) return false
    if (filter === 'approved' && !s.is_approved) return false
    if (filterState && s.state !== filterState) return false
    return true
  })

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Gerenciar Eletropostos</h1>
        <div className="flex items-center gap-2">
          <select value={filterState} onChange={(e) => setFilterState(e.target.value)}
            className="px-3 py-1.5 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-gray-800 dark:text-white">
            <option value="">Todos estados</option>
            {['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'].map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          {(['all', 'pending', 'approved'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                filter === f
                  ? 'bg-blue-600 text-white'
                   : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              {f === 'all' ? 'Todos' : f === 'pending' ? 'Pendentes' : 'Aprovados'}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">Carregando...</div>
      ) : (
        <div className="space-y-4">
          {filteredStations.map((station) => (
            <Card key={station.id} className={!station.is_approved ? 'border-yellow-200 bg-yellow-50/30 dark:border-yellow-800 dark:bg-yellow-900/10' : ''}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold text-gray-900 dark:text-white">{station.name}</h3>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                      station.is_approved
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                        : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                    }`}>
                      {station.is_approved ? 'Aprovado' : 'Pendente'}
                    </span>
                    {!station.is_active && (
                      <span className="text-xs px-2 py-1 rounded-full font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                        Inativo
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {station.address}, {station.city} - {station.state}
                  </p>
                  <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                    Proprietário: {station.subscriber?.full_name || 'N/A'} • {station.power_kw}kW • R${station.price_per_kwh}/kWh
                  </p>
                </div>
                <div className="flex gap-2">
                  {!station.is_approved && (
                    <>
                      <Button variant="primary" className="text-xs py-1.5 px-3" onClick={() => approveStation(station.id)}>
                        Aprovar
                      </Button>
                      <Button variant="danger" className="text-xs py-1.5 px-3" onClick={() => rejectStation(station.id)}>
                        Rejeitar
                      </Button>
                    </>
                  )}
                  <Button variant="secondary" className="text-xs py-1.5 px-3" onClick={() => toggleActive(station.id, station.is_active)}>
                    {station.is_active ? 'Desativar' : 'Ativar'}
                  </Button>
                </div>
              </div>
            </Card>
          ))}
          {filteredStations.length === 0 && (
            <p className="text-center text-gray-500 dark:text-gray-400 py-8">Nenhum eletroposto encontrado</p>
          )}
        </div>
      )}
    </div>
  )
}
