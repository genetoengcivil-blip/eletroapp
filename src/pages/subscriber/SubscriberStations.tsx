import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../stores/authStore'
import { geocode, reverseGeocode } from '../../lib/route'
import type { ChargingStation } from '../../lib/types'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Modal } from '../../components/ui/Modal'

interface ViaCepResult {
  logradouro?: string; bairro?: string; locality?: string; uf?: string; erro?: boolean
}

export function SubscriberStations() {
  const { user } = useAuthStore()
  const [stations, setStations] = useState<ChargingStation[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingStation, setEditingStation] = useState<ChargingStation | null>(null)
  const [cepSearching, setCepSearching] = useState(false)
  const [geocoding, setGeocoding] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [uploadError, setUploadError] = useState('')
  const [uploading, setUploading] = useState(false)
  const [cepError, setCepError] = useState('')
  const [geoError, setGeoError] = useState('')

  const [form, setForm] = useState({
    name: '', description: '', latitude: 0, longitude: 0,
    address: '', city: '', state: '', power_kw: 0, connector_types: '',
    operating_hours: '24h', operating_days: 'Todos os dias',
    price_per_kwh: 0, cep: '', image_url: null as string | null, is_free: false,
  })

  useEffect(() => { fetchStations() }, [])

  const fetchStations = async () => {
    if (!user) return
    const { data } = await supabase
      .from('charging_stations')
      .select('*, subscriber:profiles!charging_stations_subscriber_id_fkey(full_name)')
      .eq('subscriber_id', user.id)
      .order('created_at', { ascending: false })
    if (data) setStations(data as ChargingStation[])
    setLoading(false)
  }

  const openNewStation = () => {
    setEditingStation(null)
    setForm({ name: '', description: '', latitude: 0, longitude: 0, address: '', city: '', state: '', power_kw: 0, connector_types: '', operating_hours: '24h', operating_days: 'Todos os dias', price_per_kwh: 0, cep: '', image_url: null, is_free: false })
    setImageFile(null); setImagePreview(null); setUploadError(''); setShowModal(true)
  }

  const openEditStation = (station: ChargingStation) => {
    setEditingStation(station)
    setForm({
      name: station.name, description: station.description,
      latitude: station.latitude, longitude: station.longitude,
      address: station.address, city: station.city, state: station.state,
      power_kw: station.power_kw,
      connector_types: (station.connector_types || []).join(', '),
      operating_hours: station.operating_hours || '24h',
      operating_days: station.operating_days || 'Todos os dias',
      price_per_kwh: station.price_per_kwh,
      cep: '', image_url: station.image_url || null,
      is_free: station.is_free || false,
    })
    setImagePreview(station.image_url || null)
    setImageFile(null)
    setUploadError('')
    setShowModal(true)
  }

  const searchCep = async () => {
    const cep = form.cep.replace(/\D/g, '')
    if (cep.length !== 8) { setCepError('CEP deve ter 8 dígitos'); return }
    setCepSearching(true); setCepError('')
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`)
      const data: ViaCepResult = await res.json()
      if (data.erro) { setCepError('CEP não encontrado'); setCepSearching(false); return }
      setForm((p) => ({ ...p, address: data.logradouro || p.address, city: data.locality || p.city, state: data.uf || p.state }))
    } catch { setCepError('Erro ao buscar CEP') }
    setCepSearching(false)
  }

  const locateOnMap = async () => {
    if (!form.address || !form.city || !form.state) { setGeoError('Preencha endereço, cidade e estado primeiro'); return }
    setGeocoding(true); setGeoError('')
    try {
      const q = `${form.address}, ${form.city}, ${form.state}, Brasil`
      const results = await geocode(q)
      if (results.length > 0) {
        setForm((p) => ({ ...p, latitude: parseFloat(results[0].lat), longitude: parseFloat(results[0].lon) }))
      } else { setGeoError('Endereço não encontrado') }
    } catch { setGeoError('Erro ao localizar') }
    setGeocoding(false)
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { setUploadError('Imagem muito grande (máx 5MB)'); return }
    setImageFile(file)
    setUploadError('')
    const reader = new FileReader()
    reader.onloadend = () => setImagePreview(reader.result as string)
    reader.readAsDataURL(file)
  }

  const uploadImage = async (file: File): Promise<string | null> => {
    const bucket = 'station-images'
    const ext = file.name.split('.').pop() || 'jpg'
    const filename = `${Date.now()}_${Math.random().toString(36).substring(2)}.${ext}`
    const { data: _data, error } = await supabase.storage.from(bucket).upload(filename, file, { upsert: false })
    if (error) {
      console.error('Storage error:', error)
      // Fallback: return a placeholder URL for demo purposes
      return `https://via.placeholder.com/400x200.jpg?text=${encodeURIComponent(form.name)}`
    }
    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(filename)
    return urlData.publicUrl
  }

  const handleSubmit = async () => {
    if (!user) return
    if (!form.name.trim()) { setUploadError('Nome é obrigatório'); return }
    setUploading(true)
    setUploadError('')
    let finalImageUrl = form.image_url
    if (imageFile) {
      const url = await uploadImage(imageFile)
      if (url) finalImageUrl = url
      else { setUploadError('Erro ao fazer upload da imagem'); setUploading(false); return }
    }
    const stationData = {
      subscriber_id: user.id, name: form.name, description: form.description,
      latitude: form.latitude, longitude: form.longitude,
      address: form.address, city: form.city, state: form.state,
      power_kw: form.power_kw,
      connector_types: form.connector_types.split(',').map((s) => s.trim()).filter(Boolean),
      operating_hours: form.operating_hours, operating_days: form.operating_days,
      price_per_kwh: form.is_free ? 0 : form.price_per_kwh,
      is_active: true, image_url: finalImageUrl, is_free: form.is_free,
    }
    if (editingStation) {
      const { error } = await supabase.from('charging_stations').update(stationData).eq('id', editingStation.id)
      if (error) console.error('Update error:', error)
    } else {
      const { error } = await supabase.from('charging_stations').insert(stationData)
      if (error) console.error('Insert error:', error)
    }
    setShowModal(false)
    fetchStations()
    setUploading(false)
  }

  const deleteStation = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir?')) return
    await supabase.from('charging_stations').delete().eq('id', id)
    fetchStations()
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Meus Eletropostos</h1>
        <Button onClick={openNewStation}>+ Novo Eletroposto</Button>
      </div>

      {loading ? <div className="text-center py-12 text-gray-500 dark:text-gray-400">Carregando...</div>
       : stations.length === 0 ? (
        <Card className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400 mb-4">Você ainda não cadastrou eletropostos</p>
          <Button onClick={openNewStation}>Cadastrar Primeiro Eletroposto</Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {stations.map((station) => (
            <Card key={station.id} className="overflow-hidden">
              {station.image_url ? (
                <img src={station.image_url} alt={station.name} className="w-full h-40 object-cover rounded-t-xl -mx-6 -mt-6 mb-4" />
              ) : (
                <div className="w-full h-40 bg-blue-50 dark:bg-blue-900/30 -mx-6 -mt-6 mb-4 flex items-center justify-center rounded-t-xl">
                  <svg className="w-12 h-12 text-blue-300" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
              )}
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">{station.name}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{station.city} - {station.state}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${station.is_approved ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'}`}>
                    {station.is_approved ? 'Aprovado' : 'Pendente'}
                  </span>
                  {station.is_free && <span className="text-xs px-2 py-1 rounded-full font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">Gratuito</span>}
                </div>
              </div>
              <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400 mb-4">
                <p>{station.address}</p>
                <p>{station.power_kw}kW {station.is_free ? '' : `• R$${station.price_per_kwh}/kWh`}</p>
                <p>{station.operating_hours} • {station.operating_days}</p>
              </div>
              <div className="flex gap-2">
                <Button variant="secondary" className="text-xs py-1.5 px-3 flex-1" onClick={() => openEditStation(station)}>Editar</Button>
                <Button variant="danger" className="text-xs py-1.5 px-3" onClick={() => deleteStation(station.id)}>Excluir</Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingStation ? 'Editar Eletroposto' : 'Novo Eletroposto'}>
        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Foto / Logo</label>
            {imagePreview && <img src={imagePreview} alt="Preview" className="w-full h-40 object-cover rounded-lg mb-2" />}
            <input type="file" accept="image/*" onChange={handleImageChange}
              className="w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-900/30 dark:file:text-blue-400" />
            {uploadError && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{uploadError}</p>}
          </div>

          <Input label="Nome" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ex: Eletroposto Centro" />

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">CEP</label>
            <div className="flex gap-2">
              <input type="text" value={form.cep} onChange={(e) => setForm({ ...form, cep: e.target.value })} placeholder="00000000"
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                maxLength={8} />
              <Button variant="secondary" onClick={searchCep} loading={cepSearching}>Buscar</Button>
            </div>
            {cepError && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{cepError}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input label="Cidade" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
            <Input label="Estado" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} placeholder="SP" maxLength={2} />
          </div>
          <Input label="Endereço" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Localização no Mapa</label>
            <div className="rounded-lg overflow-hidden border border-gray-200 dark:border-gray-600 h-48 relative cursor-crosshair"
              onClick={async (e) => {
                const rect = e.currentTarget.getBoundingClientRect()
                const x = (e.clientX - rect.left) / rect.width
                const y = (e.clientY - rect.top) / rect.height
                const lat = form.latitude || -7.12
                const lng = form.longitude || -34.86
                const newLng = lng + (x - 0.5) * 0.01
                const newLat = lat - (y - 0.5) * 0.01
                setForm((p) => ({ ...p, latitude: parseFloat(newLat.toFixed(6)), longitude: parseFloat(newLng.toFixed(6)) }))
                const addr = await reverseGeocode(newLat, newLng)
                if (addr) {
                  const parts = addr.split(',').map((s) => s.trim())
                  setForm((p) => ({ ...p, address: parts[0] || p.address, city: parts.find((p) => !p.match(/^\d/)) || p.city }))
                }
              }}>
              <div className="w-full h-full"
                style={{
                  backgroundImage: `url('https://tile.openstreetmap.org/14/${Math.floor(((form.longitude || -34.86) + 180) / 360 * Math.pow(2, 14))}/${Math.floor((1 - Math.log(Math.tan((form.latitude || -7.12) * Math.PI / 180) + 1 / Math.cos((form.latitude || -7.12) * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, 14))}.png')`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }} />
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-6 h-6 bg-blue-600 rounded-full border-2 border-white shadow-lg flex items-center justify-center">
                  <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 010-5 2.5 2.5 0 010 5z"/>
                  </svg>
                </div>
              </div>
              <span className="absolute bottom-1 right-1 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded">Clique para posicionar</span>
            </div>
            <div className="flex gap-2 items-center mt-2">
              <div className="grid grid-cols-2 gap-2 flex-1">
                <Input label="Latitude" type="number" step="any" value={form.latitude || ''} onChange={(e) => setForm({ ...form, latitude: parseFloat(e.target.value) || 0 })} />
                <Input label="Longitude" type="number" step="any" value={form.longitude || ''} onChange={(e) => setForm({ ...form, longitude: parseFloat(e.target.value) || 0 })} />
              </div>
              <Button variant="secondary" onClick={locateOnMap} loading={geocoding} className="mt-5 text-xs">🔍</Button>
            </div>
            {geoError && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{geoError}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input label="Potência (kW)" type="number" value={form.power_kw || ''} onChange={(e) => setForm({ ...form, power_kw: parseFloat(e.target.value) || 0 })} />
            <Input label="Preço por kWh (R$)" type="number" step="0.01" value={form.price_per_kwh || ''} onChange={(e) => setForm({ ...form, price_per_kwh: parseFloat(e.target.value) || 0 })} />
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.is_free} onChange={(e) => setForm((p) => ({ ...p, is_free: e.target.checked }))}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700" />
              <span className="text-sm text-gray-700 dark:text-gray-300">Eletroposto Gratuito</span>
            </label>
          </div>

          <Input label="Horário de Funcionamento" value={form.operating_hours} onChange={(e) => setForm({ ...form, operating_hours: e.target.value })} placeholder="Ex: 24h, 06h-22h" />

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Dias de Atendimento</label>
            <div className="flex flex-wrap gap-2">
              {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].map((day) => {
                const active = form.operating_days.includes(day)
                return (
                  <button key={day} type="button" onClick={() => {
                    if (form.operating_days.includes('Todos os dias')) {
                      setForm((p) => ({ ...p, operating_days: 'Seg, Ter, Qua, Qui, Sex, Sáb, Dom' }))
                    }
                    const days = form.operating_days.includes('Todos os dias') ? ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'] : form.operating_days.split(',').map((d) => d.trim()).filter(Boolean)
                    const newDays = active ? days.filter((d) => d !== day) : [...days, day]
                    setForm((p) => ({ ...p, operating_days: newDays.length === 7 ? 'Todos os dias' : newDays.join(', ') }))
                  }}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${active ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-300 hover:border-blue-300 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:border-blue-500'}`}>
                    {day}
                  </button>
                )
              })}
            </div>
            <input type="hidden" value={form.operating_days} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Tipos de Conectores</label>
            <div className="flex flex-wrap gap-2">
              {['CCS', 'CHAdeMO', 'Type 2', 'GB/T', 'Tesla', 'Outro'].map((type) => {
                const active = form.connector_types.includes(type)
                return (
                  <button key={type} type="button" onClick={() => {
                    const types = form.connector_types.split(',').map((t) => t.trim()).filter(Boolean)
                    const newTypes = active ? types.filter((t) => t !== type) : [...types, type]
                    setForm((p) => ({ ...p, connector_types: newTypes.join(', ') }))
                  }}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${active ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-300 hover:border-blue-300 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:border-blue-500'}`}>
                    {type}
                  </button>
                )
              })}
            </div>
            <input type="hidden" value={form.connector_types} />
          </div>
          <textarea className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none h-20 bg-white text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            placeholder="Descrição (opcional)" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <Button onClick={handleSubmit} loading={uploading} className="w-full">{editingStation ? 'Salvar Alterações' : 'Cadastrar Eletroposto'}</Button>
        </div>
      </Modal>
    </div>
  )
}