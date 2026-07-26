import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import type { SubscriptionPlan, Subscription, BillingPeriod } from '../../lib/types'

const PERIOD_LABELS: Record<BillingPeriod, { label: string; months: number; discount: string }> = {
  monthly: { label: 'Mensal', months: 1, discount: '' },
  semester: { label: 'Semestral', months: 6, discount: 'Economize 10%' },
  annual: { label: 'Anual', months: 12, discount: 'Economize 20%' },
}


export function SubscriberSubscription() {
  const { user } = useAuth()
  const [plans, setPlans] = useState<SubscriptionPlan[]>([])
  const [currentSub, setCurrentSub] = useState<Subscription | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedPeriod, setSelectedPeriod] = useState<BillingPeriod>('monthly')
  const [purchasing, setPurchasing] = useState<string | null>(null)

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    const [plansRes, subRes] = await Promise.all([
      supabase.from('subscription_plans').select('*').eq('is_active', true).order('price'),
      user ? supabase.from('subscriptions').select('*, plan:subscription_plans(*)').eq('user_id', user.id).eq('status', 'active').single() : null,
    ])
    if (plansRes.data) setPlans(plansRes.data as any)
    if (subRes?.data) setCurrentSub(subRes.data as any)
    setLoading(false)
  }

  const selectPlan = async (plan: SubscriptionPlan) => {
    if (!user) return
    setPurchasing(plan.id)
    if (currentSub) {
      await supabase.from('subscriptions').update({ status: 'cancelled' }).eq('id', currentSub.id)
    }
    const expiresAt = new Date()
    expiresAt.setMonth(expiresAt.getMonth() + plan.period_months)
    await supabase.from('subscriptions').insert({
      user_id: user.id,
      plan_id: plan.id,
      billing_period: plan.billing_period,
      status: 'active',
      starts_at: new Date().toISOString(),
      expires_at: expiresAt.toISOString(),
    })
    setPurchasing(null)
    fetchData()
  }

  if (loading) {
    return (
      <div className="p-6 text-center py-16">
        <div className="w-10 h-10 border-4 border-blue-200 dark:border-blue-800 rounded-full mx-auto" />
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin -mt-14 mx-auto" />
      </div>
    )
  }

  const periodPlans = plans.filter(p => p.billing_period === selectedPeriod && !p.is_promo)
  const promoPlan = plans.find(p => p.is_promo)

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">Minha Assinatura</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Gerencie seu plano e assinatura</p>
      </div>

      {currentSub && (
        <div className="glass-card p-5 sm:p-6 mb-8 !border-emerald-200/50 dark:!border-emerald-500/20 !bg-gradient-to-br !from-emerald-50/80 !to-blue-50/50 dark:!from-emerald-900/15 dark:!to-blue-900/10">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-blue-600 flex items-center justify-center flex-shrink-0 shadow-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">Plano Ativo</p>
                <h3 className="text-xl font-extrabold text-gray-900 dark:text-white">{currentSub.plan?.name}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                  Expira em {new Date(currentSub.expires_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-sm px-4 py-1.5 rounded-full font-semibold">
                Ativo
              </span>
              <button
                onClick={async () => {
                  if (!confirm('Tem certeza que deseja cancelar?')) return
                  await supabase.from('subscriptions').update({ status: 'cancelled' }).eq('id', currentSub.id)
                  setCurrentSub(null)
                }}
                className="text-xs text-red-500 hover:text-red-600 font-medium"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mb-6">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Escolher Plano</h2>
        <div className="flex gap-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-2xl w-fit">
          {(Object.keys(PERIOD_LABELS) as BillingPeriod[]).map((period) => (
            <button
              key={period}
              onClick={() => setSelectedPeriod(period)}
              className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                selectedPeriod === period
                  ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              {PERIOD_LABELS[period].label}
              {PERIOD_LABELS[period].discount && (
                <span className="ml-1.5 text-[10px] bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5 rounded-full">
                  {PERIOD_LABELS[period].discount}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-10">
        {periodPlans.map((plan) => {
          const isCurrent = currentSub?.plan_id === plan.id
          const isPopular = plan.base_plan === 'Profissional'
          return (
            <div
              key={plan.id}
              className={`relative glass-card p-5 sm:p-6 transition-all hover:scale-[1.02] ${
                isCurrent ? '!border-blue-400 dark:!border-blue-500/40 !bg-blue-50/50 dark:!bg-blue-900/10' : ''
              } ${isPopular ? '!border-blue-300 dark:!border-blue-600/40 !shadow-lg !shadow-blue-600/5' : ''}`}
            >
              {isCurrent && (
                <span className="absolute -top-3 left-4 bg-blue-600 text-white text-[10px] px-3 py-1 rounded-full font-bold uppercase tracking-wide">
                  Atual
                </span>
              )}
              {isPopular && !isCurrent && (
                <span className="absolute -top-3 left-4 bg-gradient-to-r from-blue-600 to-blue-500 text-white text-[10px] px-3 py-1 rounded-full font-bold uppercase tracking-wide shadow-sm">
                  Mais Popular
                </span>
              )}

              <h3 className="text-xl font-extrabold text-gray-900 dark:text-white">{plan.name}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 min-h-[40px]">{plan.description}</p>

              <div className="mt-5 mb-1">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-gray-900 dark:text-white">R$ {plan.price.toFixed(2)}</span>
                </div>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  {plan.period_months === 1 ? 'por mês' : `R$ ${(plan.price / plan.period_months).toFixed(2)}/mês`}
                  {plan.period_months > 1 && ` • ${plan.period_months} meses`}
                </p>
              </div>

              <p className="text-sm text-blue-600 dark:text-blue-400 font-semibold mt-3">
                Até {plan.max_stations} eletroposto{plan.max_stations > 1 ? 's' : ''}
              </p>

              <ul className="mt-4 space-y-2.5">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-300">
                    <svg className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => selectPlan(plan)}
                disabled={isCurrent || purchasing === plan.id}
                className={`w-full mt-6 py-3 rounded-xl font-bold text-sm transition-all ${
                  isCurrent
                    ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed'
                    : isPopular
                    ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white hover:from-blue-700 hover:to-blue-600 shadow-lg shadow-blue-600/20'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                } disabled:opacity-60`}
              >
                {purchasing === plan.id ? 'Processando...' : isCurrent ? 'Plano Atual' : 'Escolher Plano'}
              </button>
            </div>
          )
        })}
      </div>

      {promoPlan && (
        <div className="glass-card p-5 sm:p-6 !border-purple-200/50 dark:!border-purple-500/20 !bg-gradient-to-br !from-purple-50/80 !to-blue-50/50 dark:!from-purple-900/15 dark:!to-blue-900/10">
          <div className="flex flex-col sm:flex-row items-start gap-5">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-purple-600/20">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-lg font-extrabold text-gray-900 dark:text-white">{promoPlan.name}</h3>
                <span className="text-[10px] bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 px-2 py-0.5 rounded-full font-bold uppercase">
                  EV
                </span>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">{promoPlan.description}</p>
              <div className="flex items-baseline gap-1 mb-3">
                <span className="text-3xl font-extrabold text-gray-900 dark:text-white">R$ {promoPlan.price.toFixed(2)}</span>
                <span className="text-sm text-gray-400">/mês</span>
              </div>
              <div className="flex flex-wrap gap-2 mb-4">
                {promoPlan.features.map((f) => (
                  <span key={f} className="text-xs bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 px-3 py-1 rounded-full font-medium">
                    {f}
                  </span>
                ))}
              </div>
              <button
                onClick={() => selectPlan(promoPlan)}
                disabled={currentSub?.plan_id === promoPlan.id || purchasing === promoPlan.id}
                className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-bold text-sm hover:from-purple-700 hover:to-blue-700 shadow-lg shadow-purple-600/20 disabled:opacity-50"
              >
                {currentSub?.plan_id === promoPlan.id ? 'Plano Atual' : 'Ativar Divulgação EV'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
