import { useState, useRef } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../stores/authStore'
import { useAuth } from '../../hooks/useAuth'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'

export function Profile() {
  const { user } = useAuthStore()
  const { profile, loading: authLoading } = useAuth()
  const { fetchProfile } = useAuthStore()
  const [fullName, setFullName] = useState(profile?.full_name || '')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(profile?.avatar_url || null)
  const [uploading, setUploading] = useState(false)
  const [msg, setMsg] = useState({ type: '', text: '' })
  const fileRef = useRef<HTMLInputElement>(null)

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) { setMsg({ type: 'error', text: 'Imagem muito grande (máx 2MB)' }); return }
    setImageFile(file)
    const reader = new FileReader()
    reader.onloadend = () => setImagePreview(reader.result as string)
    reader.readAsDataURL(file)
  }

  const uploadAvatar = async (file: File): Promise<string | null> => {
    const bucket = 'avatars'
    const ext = file.name.split('.').pop() || 'jpg'
    const filename = `${user!.id}.${ext}`
    const { error } = await supabase.storage.from(bucket).upload(filename, file, { upsert: true })
    if (error) { console.error('Upload error:', error); return null }
    const { data } = supabase.storage.from(bucket).getPublicUrl(filename)
    return data.publicUrl
  }

  const handleSave = async () => {
    if (!user || !fullName.trim()) { setMsg({ type: 'error', text: 'Nome é obrigatório' }); return }
    setUploading(true)
    setMsg({ type: '', text: '' })
    let avatarUrl = profile?.avatar_url || null
    if (imageFile) {
      const url = await uploadAvatar(imageFile)
      if (url) avatarUrl = url
    }
    const { error } = await supabase.from('profiles').update({ full_name: fullName, avatar_url: avatarUrl }).eq('id', user.id)
    if (error) {
      setMsg({ type: 'error', text: 'Erro ao salvar: ' + error.message })
    } else {
      setMsg({ type: 'success', text: 'Perfil salvo com sucesso!' })
      // Re-fetch profile to update store
      await fetchProfile(user.id)
    }
    setUploading(false)
  }

  const initials = (name: string) => name.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase()

  if (authLoading) return     <div className="p-6 text-center text-gray-500 dark:text-gray-400">Carregando...</div>

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Meu Perfil</h1>

      <Card>
        <div className="flex flex-col items-center mb-6">
          <div className="relative">
            {imagePreview ? (
              <img src={imagePreview} alt="Avatar" className="w-24 h-24 rounded-full object-cover border-4 border-blue-100" />
            ) : (
              <div className="w-24 h-24 rounded-full bg-blue-600 flex items-center justify-center text-white text-2xl font-bold border-4 border-blue-100">
                {initials(fullName || user?.email || '?')}
              </div>
            )}
            <button onClick={() => fileRef.current?.click()}
              className="absolute bottom-0 right-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white hover:bg-blue-700 shadow-md">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
          </div>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">Clique na foto para alterar</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Nome Completo</label>
            <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              placeholder="Seu nome" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Email</label>
            <input type="email" value={user?.email || ''} disabled
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg bg-gray-50 text-gray-400 outline-none dark:bg-gray-800 dark:border-gray-700 dark:text-gray-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Tipo de Conta</label>
            <span className={`inline-block text-xs px-3 py-1.5 rounded-full font-medium ${
              profile?.role === 'admin' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
              profile?.role === 'subscriber' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' :
              'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
            }`}>
              {profile?.role === 'admin' ? 'Administrador' :
               profile?.role === 'subscriber' ? 'Proprietário de Eletropostos' :
               'Usuário'}
            </span>
          </div>
          {msg.text && (
            <div className={`text-sm p-3 rounded-lg ${msg.type === 'error' ? 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400'}`}>
              {msg.text}
            </div>
          )}
          <Button onClick={handleSave} loading={uploading} className="w-full">Salvar Perfil</Button>
        </div>
      </Card>
    </div>
  )
}