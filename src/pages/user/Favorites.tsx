import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../stores/authStore'
import type { Favorite, ChargingStation } from '../../lib/types'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'

export function Favorites() {
  const { user } = useAuthStore()
  const [favorites, setFavorites] = useState<(Favorite & { station: ChargingStation })[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchFavorites()
  }, [])

  const fetchFavorites = async () => {
    if (!user) return
    const { data } = await supabase
      .from('favorites')
      .select('*, station:charging_stations(*)')
      .eq('user_id', user.id)

    if (data) setFavorites(data as any[])
    setLoading(false)
  }

  const removeFavorite = async (favoriteId: string) => {
    await supabase.from('favorites').delete().eq('id', favoriteId)
    setFavorites((prev) => prev.filter((f) => f.id !== favoriteId))
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Meus Favoritos</h1>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Carregando...</div>
      ) : favorites.length === 0 ? (
        <Card className="text-center py-12">
          <svg className="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
          <p className="text-gray-500 mb-4">Você ainda não tem favoritos</p>
          <Link to="/dashboard" className="text-blue-600 hover:text-blue-700 font-medium">
            Explorar eletropostos →
          </Link>
        </Card>
      ) : (
        <div className="space-y-4">
          {favorites.map((fav) => (
            <Card key={fav.id} className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-gray-900">{fav.station?.name}</h3>
                <p className="text-sm text-gray-500">{fav.station?.address}, {fav.station?.city}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm text-blue-600">{fav.station?.power_kw}kW</span>
                  <span className="text-gray-300">•</span>
                  <span className="text-sm text-gray-600">R${fav.station?.price_per_kwh}/kWh</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" className="text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => removeFavorite(fav.id)}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </Button>
                <Link to={`/dashboard/station/${fav.station_id}`}>
                  <Button variant="secondary" className="text-sm">Ver</Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
