import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import type { Review, ChargingStation } from '../../lib/types'
import { Card } from '../../components/ui/Card'

export function UserReviews() {
  const { user } = useAuth()
  const [reviews, setReviews] = useState<(Review & { station: ChargingStation })[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchReviews()
  }, [])

  const fetchReviews = async () => {
    if (!user) return
    const { data } = await supabase
      .from('reviews')
      .select('*, station:charging_stations(name, city, address)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (data) setReviews(data as any[])
    setLoading(false)
  }

  const renderStars = (rating: number) => (
    <div className="flex">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          className={`w-4 h-4 ${star <= rating ? 'text-yellow-400' : 'text-gray-300'}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  )

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Minhas Avaliações</h1>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Carregando...</div>
      ) : reviews.length === 0 ? (
        <Card className="text-center py-12">
          <p className="text-gray-500">Você ainda não fez nenhuma avaliação</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <Card key={review.id}>
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-medium text-gray-900">{review.station?.name}</h3>
                  <p className="text-sm text-gray-500">{review.station?.address}, {review.station?.city}</p>
                  <div className="mt-2">{renderStars(review.rating)}</div>
                  {review.comment && (
                    <p className="text-sm text-gray-600 mt-2">{review.comment}</p>
                  )}
                </div>
                <span className="text-xs text-gray-400">
                  {new Date(review.created_at).toLocaleDateString('pt-BR')}
                </span>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
