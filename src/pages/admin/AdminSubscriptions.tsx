import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import type { Subscription } from '../../lib/types'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'

export function AdminSubscriptions() {
  const [subscriptions, setSubscriptions] = useState<(Subscription & { plan?: { name: string; price: number }; profile?: { full_name: string } })[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSubscriptions()
  }, [])

  const fetchSubscriptions = async () => {
    const { data } = await supabase
      .from('subscriptions')
      .select('*, plan:subscription_plans(name, price), profile:profiles(full_name)')
      .order('created_at', { ascending: false })
    if (data) setSubscriptions(data as any[])
    setLoading(false)
  }

  const cancelSubscription = async (id: string) => {
    await supabase.from('subscriptions').update({ status: 'cancelled' }).eq('id', id)
    fetchSubscriptions()
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Gerenciar Assinaturas</h1>

      {loading ? (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">Carregando...</div>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b dark:border-gray-700">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Usuário</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Plano</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Início</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Expira</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Ações</th>
                </tr>
              </thead>
              <tbody>
                {subscriptions.map((sub) => (
                  <tr key={sub.id} className="border-b last:border-b-0 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-700">
                    <td className="py-3 px-4 text-sm font-medium text-gray-900 dark:text-white">
                      {sub.profile?.full_name || 'N/A'}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-300">{sub.plan?.name}</td>
                    <td className="py-3 px-4">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        sub.status === 'active' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                        sub.status === 'cancelled' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                        'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
                      }`}>
                        {sub.status === 'active' ? 'Ativa' : sub.status === 'cancelled' ? 'Cancelada' : 'Inativa'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-500 dark:text-gray-400">
                      {new Date(sub.starts_at).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-500 dark:text-gray-400">
                      {new Date(sub.expires_at).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="py-3 px-4">
                      {sub.status === 'active' && (
                        <Button variant="danger" className="text-xs py-1 px-2" onClick={() => cancelSubscription(sub.id)}>
                          Cancelar
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {subscriptions.length === 0 && (
            <p className="text-center text-gray-500 dark:text-gray-400 py-8">Nenhuma assinatura encontrada</p>
          )}
        </Card>
      )}
    </div>
  )
}
