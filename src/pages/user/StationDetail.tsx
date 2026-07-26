import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../stores/authStore'
import type { ChargingStation, Review } from '../../lib/types'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { addReviewPoints } from '../../lib/loyalty'
import { getPriceAlerts, addPriceAlert, removePriceAlert } from '../../lib/priceAlerts'

export function StationDetail() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [station, setStation] = useState<ChargingStation | null>(null)
  const [reviews, setReviews] = useState<(Review & { user: { full_name: string } })[]>([])
  const [isFavorite, setIsFavorite] = useState(false)
  const [favoriteNote, setFavoriteNote] = useState('')
  const [showNoteInput, setShowNoteInput] = useState(false)
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [reviewPhoto, setReviewPhoto] = useState<File | null>(null)
  const [reviewPhotoPreview, setReviewPhotoPreview] = useState<string | null>(null)
  const [reviewSubmitting, setReviewSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)
  const [lightboxPhoto, setLightboxPhoto] = useState<string | null>(null)
  const [hasPriceAlert, setHasPriceAlert] = useState(false)
  const [alertTargetPrice, setAlertTargetPrice] = useState('')
  const [showAlertInput, setShowAlertInput] = useState(false)

  useEffect(() => {
    if (id) {
      fetchStation()
      fetchReviews()
      checkFavorite()
      if (user) {
        getPriceAlerts(user.id).then(alerts => {
          setHasPriceAlert(alerts.some(a => a.station_id === id))
        })
      }
    }
  }, [id])

  const fetchStation = async () => {
    const { data } = await supabase
      .from('charging_stations')
      .select('*')
      .eq('id', id)
      .single()
    if (data) setStation(data)
    setLoading(false)
  }

  const fetchReviews = async () => {
    const { data } = await supabase
      .from('reviews')
      .select('*, user:profiles(full_name)')
      .eq('station_id', id)
      .order('created_at', { ascending: false })
    if (data) setReviews(data as any[])
  }

  const checkFavorite = async () => {
    if (!user) return
    const { data } = await supabase
      .from('favorites')
      .select('id, note')
      .eq('user_id', user.id)
      .eq('station_id', id!)
      .single()
    setIsFavorite(!!data)
    setFavoriteNote(data?.note || '')
  }

  const toggleFavorite = async () => {
    if (!user || !id) return
    if (isFavorite) {
      await supabase.from('favorites').delete().eq('user_id', user.id).eq('station_id', id)
      setIsFavorite(false)
      setFavoriteNote('')
      setShowNoteInput(false)
    } else {
      await supabase.from('favorites').insert({ user_id: user.id, station_id: id, note: favoriteNote || null })
      setIsFavorite(true)
      setShowNoteInput(true)
    }
  }

  const saveFavoriteNote = async () => {
    if (!user || !id) return
    await supabase.from('favorites').update({ note: favoriteNote || null }).eq('user_id', user.id).eq('station_id', id)
    setShowNoteInput(false)
  }

  const togglePriceAlert = async () => {
    if (!id || !station || !user) return
    if (hasPriceAlert) {
      const alerts = await getPriceAlerts(user.id)
      const alert = alerts.find(a => a.station_id === id)
      if (alert) await removePriceAlert(user.id, alert.id)
      setHasPriceAlert(false)
    } else {
      setShowAlertInput(true)
    }
  }

  const savePriceAlert = async () => {
    if (!id || !station || !alertTargetPrice || !user) return
    const price = parseFloat(alertTargetPrice)
    if (isNaN(price) || price <= 0) return
    await addPriceAlert(user.id, id, station.name, price)
    setHasPriceAlert(true)
    setShowAlertInput(false)
    setAlertTargetPrice('')
  }

  const submitReview = async () => {
    if (!user || !id) return
    setReviewSubmitting(true)
    let photoUrl: string | null = null
    if (reviewPhoto) {
      const ext = reviewPhoto.name.split('.').pop()
      const path = `review-photos/${user.id}/${id}-${Date.now()}.${ext}`
      const { data: uploadData } = await supabase.storage.from('avatars').upload(path, reviewPhoto)
      if (uploadData) {
        const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(uploadData.path)
        photoUrl = urlData.publicUrl
      }
    }
    await supabase.from('reviews').upsert({
      user_id: user.id,
      station_id: id,
      rating,
      comment,
      photo_url: photoUrl,
    })
    if (user) await addReviewPoints(user.id, id!)
    setShowReviewModal(false)
    setComment('')
    setRating(5)
    setReviewPhoto(null)
    setReviewPhotoPreview(null)
    setReviewSubmitting(false)
    fetchReviews()
  }

  const openRoute = async () => {
    if (!station || !user) return
    // Navigate to dashboard with station as destination - the dashboard will handle route calculation
    navigate(`/dashboard?station=${station.id}&lat=${station.latitude}&lng=${station.longitude}&name=${encodeURIComponent(station.name)}&city=${encodeURIComponent(station.city)}`)
  }

  if (loading) return <div className="p-6 text-center text-gray-500 dark:text-gray-400">Carregando...</div>
  if (!station) return <div className="p-6 text-center text-gray-500 dark:text-gray-400">Eletroposto não encontrado</div>

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <Link to="/dashboard" className="glass-btn-secondary inline-flex items-center gap-1.5 px-4 py-2 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium mb-4">
        ← Voltar ao mapa
      </Link>

      {station.image_url && (
        <img src={station.image_url} alt={station.name}
          className="w-full h-64 object-cover rounded-2xl mb-6" />
      )}

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{station.name}</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">{station.address}, {station.city} - {station.state}</p>
          {isFavorite && favoriteNote && !showNoteInput && (
            <p className="text-sm text-blue-600 mt-1 italic">📝 {favoriteNote}</p>
          )}
        </div>
        <div className="flex gap-2">
          {user && (
            <div className="relative">
              <Button variant="ghost" onClick={toggleFavorite}>
                <svg className={`w-5 h-5 ${isFavorite ? 'text-red-500 fill-red-500' : 'text-gray-400'}`} fill={isFavorite ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </Button>
              {isFavorite && showNoteInput && (
                <div className="absolute top-full right-0 mt-1 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg p-3 z-50">
                  <input type="text" value={favoriteNote} onChange={(e) => setFavoriteNote(e.target.value)}
                    placeholder="Adicionar nota pessoal..."
                    className="w-full px-3 py-1.5 border border-gray-200 dark:border-gray-600 rounded text-sm focus:ring-1 focus:ring-blue-500 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                  <div className="flex gap-2 mt-2">
                    <Button variant="primary" className="text-xs py-1 px-3" onClick={saveFavoriteNote}>Salvar</Button>
                    <Button variant="secondary" className="text-xs py-1 px-3" onClick={() => { setShowNoteInput(false); setFavoriteNote('') }}>Cancelar</Button>
                  </div>
                </div>
              )}
            </div>
          )}
          {!station.is_free && user && (
            <div className="relative">
              <Button variant="ghost" onClick={togglePriceAlert}>
                <svg className={`w-5 h-5 ${hasPriceAlert ? 'text-amber-500' : 'text-gray-400'}`} fill={hasPriceAlert ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </Button>
              {showAlertInput && (
                <div className="absolute top-full right-0 mt-1 w-56 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg p-3 z-50">
                  <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Alertar quando preço ≤</p>
                  <input type="number" step="0.1" value={alertTargetPrice} onChange={(e) => setAlertTargetPrice(e.target.value)}
                    placeholder="R$/kWh"
                    className="w-full px-3 py-1.5 border border-gray-200 dark:border-gray-600 rounded text-sm focus:ring-1 focus:ring-blue-500 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                  <div className="flex gap-2 mt-2">
                    <Button variant="primary" className="text-xs py-1 px-3" onClick={savePriceAlert}>Salvar</Button>
                    <Button variant="secondary" className="text-xs py-1 px-3" onClick={() => { setShowAlertInput(false); setAlertTargetPrice('') }}>Cancelar</Button>
                  </div>
                </div>
              )}
            </div>
          )}
          <a href={`https://www.google.com/maps/dir/?api=1&destination=${station.latitude},${station.longitude}&travelmode=driving`}
            target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-4 py-2 glass-btn text-white text-sm font-medium">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
            </svg>
            Google Maps
          </a>
          <a href={`https://www.waze.com/ul?ll=${station.latitude},${station.longitude}&navigate=yes`}
            target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-4 py-2 glass-btn text-white text-sm font-medium" style={{ background: 'linear-gradient(135deg, rgba(34,197,94,0.9), rgba(22,163,74,0.9))' }}>
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
            Waze
          </a>
          <Button onClick={openRoute}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
            Ver no Mapa
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="glass-card p-5">
          <p className="text-sm text-gray-500 dark:text-gray-400">Potência</p>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{station.power_kw} kW</p>
        </div>
        <div className="glass-card p-5">
          <p className="text-sm text-gray-500 dark:text-gray-400">Preço por kWh</p>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">R$ {station.price_per_kwh}</p>
        </div>
        <div className="glass-card p-5">
          <p className="text-sm text-gray-500 dark:text-gray-400">Horário</p>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{station.operating_hours}</p>
        </div>
      </div>

      {station.description && (
        <div className="glass-card p-5 mb-6">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Descrição</h3>
          <p className="text-gray-600 dark:text-gray-400">{station.description}</p>
        </div>
      )}

      {station.connector_types?.length > 0 && (
        <div className="glass-card p-5 mb-6">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Conectores</h3>
          <div className="flex flex-wrap gap-2">
            {station.connector_types.map((type) => (
              <span key={type} className="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-sm px-3 py-1 rounded-full">
                {type}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Reviews */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Avaliações</h2>
        {user && (
          <Button variant="secondary" onClick={() => setShowReviewModal(true)}>
            Avaliar
          </Button>
        )}
      </div>

      <div className="space-y-3">
        {reviews.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-sm">Nenhuma avaliação ainda</p>
        ) : (
          reviews.map((review) => (
            <div key={review.id} className="glass-card p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{review.user?.full_name}</p>
                  <div className="flex mt-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <svg key={star} className={`w-3.5 h-3.5 ${star <= review.rating ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'}`} fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  {review.comment && <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">{review.comment}</p>}
                  {(review as any).photo_url && (
                    <button onClick={() => setLightboxPhoto((review as any).photo_url)} className="mt-2 block">
                      <img src={(review as any).photo_url} alt="Foto da avaliação"
                        className="rounded-lg max-h-48 object-cover cursor-pointer hover:opacity-90 transition-opacity" />
                    </button>
                  )}
                </div>
                <span className="text-xs text-gray-400 dark:text-gray-500">{new Date(review.created_at).toLocaleDateString('pt-BR')}</span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Review Modal */}
      <Modal isOpen={showReviewModal} onClose={() => setShowReviewModal(false)} title="Avaliar Eletroposto">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Nota</label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  className="focus:outline-none"
                >
                  <svg className={`w-8 h-8 ${star <= rating ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'}`} fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Comentário (opcional)</label>
            <textarea
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none h-24 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Descreva sua experiência..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Foto (opcional)</label>
            <input type="file" accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0] || null
                setReviewPhoto(file)
                if (file) {
                  const reader = new FileReader()
                  reader.onload = (ev) => setReviewPhotoPreview(ev.target?.result as string)
                  reader.readAsDataURL(file)
                } else {
                  setReviewPhotoPreview(null)
                }
              }}
              className="w-full text-sm text-gray-500 dark:text-gray-400 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-900/30 dark:file:text-blue-400" />
            {reviewPhotoPreview && (
              <img src={reviewPhotoPreview} alt="Preview" className="mt-2 rounded-lg max-h-32 object-cover" />
            )}
          </div>
          <Button onClick={submitReview} className="w-full" loading={reviewSubmitting}>
            Enviar Avaliação
          </Button>
        </div>
      </Modal>

      {/* Lightbox */}
      {lightboxPhoto && (
        <div className="fixed inset-0 z-[9999] bg-black/90 flex items-center justify-center p-4" onClick={() => setLightboxPhoto(null)}>
          <button onClick={() => setLightboxPhoto(null)} className="absolute top-4 right-4 text-white/80 hover:text-white z-10">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <img src={lightboxPhoto} alt="Foto ampliada" className="max-w-full max-h-full object-contain rounded-lg" onClick={(e) => e.stopPropagation()} />
        </div>
      )}
    </div>
  )
}
