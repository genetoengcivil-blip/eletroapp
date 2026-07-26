import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import type { SubscriptionPlan, Subscription } from '../../lib/types'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'

export function SubscriberSubscription() {
  const { user } = useAuth()
  const [plans, setPlans] = useState<SubscriptionPlan[]>([])
  const [currentSub, setCurrentSub] = useState<Subscription | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    const [plansRes, subRes] = await Promise.all([
      supabase.from('subscription_plans').select('*').eq('is_active', true).order('price'),
      user ? supabase.from('subscriptions').select('*, plan:subscription_plans(*)').eq('user_id', user.id).eq('status', 'active').single() : null,
    ])

    if (plansRes.data) setPlans(plansRes.data)
    if (subRes?.data) setCurrentSub(subRes.data as any)
    setLoading(false)
  }

  const selectPlan = async (planId: string) => {
    if (!user) return

    if (currentSub) {
      await supabase.from('subscriptions').update({ status: 'cancelled' }).eq('id', currentSub.id)
    }

    const expiresAt = new Date()
    expiresAt.setMonth(expiresAt.getMonth() + 1)

    await supabase.from('subscriptions').insert({
      user_id: user.id,
      plan_id: planId,
      status: 'active',
      starts_at: new Date().toISOString(),
      expires_at: expiresAt.toISOString(),
    })

    fetchData()
  }

  if (loading) return <div className="p-6 text-center text-gray-500">Carregando...</div>

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Minha Assinatura</h1>

      {currentSub && (
        <Card className="mb-8 bg-blue-50 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600 font-medium">Plano Atual</p>
              <h3 className="text-xl font-bold text-gray-900 mt-1">{currentSub.plan?.name}</h3>
              <p className="text-sm text-gray-500 mt-1">
                Expira em: {new Date(currentSub.expires_at).toLocaleDateString('pt-BR')}
              </p>
            </div>
            <span className="bg-blue-100 text-blue-700 text-sm px-4 py-2 rounded-full font-medium">
              Ativo
            </span>
          </div>
        </Card>
      )}

      <h2 className="text-lg font-semibold text-gray-900 mb-4">Escolher Plano</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => {
          const isCurrent = currentSub?.plan_id === plan.id
          return (
            <Card key={plan.id} className={`relative ${isCurrent ? 'ring-2 ring-blue-500' : ''}`}>
              {isCurrent && (
                <span className="absolute -top-3 left-4 bg-blue-600 text-white text-xs px-3 py-1 rounded-full font-medium">
                  Atual
                </span>
              )}
              <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
              <p className="text-sm text-gray-500 mt-1">{plan.description}</p>
              <div className="mt-4">
                <span className="text-3xl font-bold text-gray-900">R$ {plan.price}</span>
                <span className="text-gray-500">/mês</span>
              </div>
              <p className="text-sm text-gray-500 mt-2">Até {plan.max_stations} eletropostos</p>
              <ul className="mt-4 space-y-2">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-sm text-gray-600">
                    <svg className="w-4 h-4 text-blue-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>
              <Button
                variant={isCurrent ? 'secondary' : 'primary'}
                className="w-full mt-6"
                disabled={isCurrent}
                onClick={() => selectPlan(plan.id)}
              >
                {isCurrent ? 'Plano Atual' : 'Escolher Plano'}
              </Button>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
