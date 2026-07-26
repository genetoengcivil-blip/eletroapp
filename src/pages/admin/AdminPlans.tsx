import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import type { SubscriptionPlan, BillingPeriod } from '../../lib/types'
import { Modal } from '../../components/ui/Modal'

const PERIOD_OPTIONS: { value: BillingPeriod; label: string; months: number }[] = [
  { value: 'monthly', label: 'Mensal', months: 1 },
  { value: 'semester', label: 'Semestral', months: 6 },
  { value: 'annual', label: 'Anual', months: 12 },
]

const BASE_PLAN_OPTIONS = ['Básico', 'Profissional', 'Empresarial', 'Divulgação EV']

export function AdminPlans() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null)
  const [form, setForm] = useState({
    name: '', description: '', price: 0, max_stations: 1, features: '',
    billing_period: 'monthly' as BillingPeriod, base_plan: 'Básico', is_promo: false,
  })

  useEffect(() => { fetchPlans() }, [])

  const fetchPlans = async () => {
    const { data } = await supabase.from('subscription_plans').select('*').order('price')
    if (data) setPlans(data as any)
    setLoading(false)
  }

  const openNewPlan = () => {
    setEditingPlan(null)
    setForm({ name: '', description: '', price: 0, max_stations: 1, features: '', billing_period: 'monthly', base_plan: 'Básico', is_promo: false })
    setShowModal(true)
  }

  const openEditPlan = (plan: SubscriptionPlan) => {
    setEditingPlan(plan)
    setForm({
      name: plan.name, description: plan.description, price: plan.price,
      max_stations: plan.max_stations, features: plan.features.join('\n'),
      billing_period: plan.billing_period, base_plan: plan.base_plan, is_promo: plan.is_promo,
    })
    setShowModal(true)
  }

  const handleSubmit = async () => {
    const planData = {
      name: form.name, description: form.description, price: form.price,
      max_stations: form.max_stations, features: form.features.split('\n').filter(Boolean),
      billing_period: form.billing_period, period_months: PERIOD_OPTIONS.find(p => p.value === form.billing_period)?.months || 1,
      base_plan: form.base_plan, is_promo: form.is_promo,
    }
    if (editingPlan) {
      await supabase.from('subscription_plans').update(planData).eq('id', editingPlan.id)
    } else {
      await supabase.from('subscription_plans').insert({ ...planData, is_active: true })
    }
    setShowModal(false)
    fetchPlans()
  }

  const toggleActive = async (id: string, current: boolean) => {
    await supabase.from('subscription_plans').update({ is_active: !current }).eq('id', id)
    fetchPlans()
  }

  const deletePlan = async (id: string) => {
    if (!confirm('Tem certeza?')) return
    await supabase.from('subscription_plans').delete().eq('id', id)
    fetchPlans()
  }

  const grouped = BASE_PLAN_OPTIONS.reduce((acc, base) => {
    acc[base] = plans.filter(p => p.base_plan === base)
    return acc
  }, {} as Record<string, SubscriptionPlan[]>)

  const promoPlans = plans.filter(p => p.is_promo)

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight">Gerenciar Planos</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{plans.length} planos cadastrados</p>
        </div>
        <button onClick={openNewPlan} className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20">
          + Novo Plano
        </button>
      </div>

      {loading ? (
        <div className="text-center py-16">
          <div className="w-10 h-10 border-4 border-blue-200 dark:border-blue-800 rounded-full mx-auto" />
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin -mt-14 mx-auto" />
        </div>
      ) : (
        <div className="space-y-8">
          {BASE_PLAN_OPTIONS.map((base) => {
            const basePlans = grouped[base] || []
            if (basePlans.length === 0) return null
            return (
              <div key={base}>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  {base}
                  <span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-500 px-2 py-0.5 rounded-full">{basePlans.length} variantes</span>
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {basePlans.map((plan) => (
                    <div key={plan.id} className={`glass-card p-4 ${!plan.is_active ? 'opacity-50' : ''}`}>
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wide text-blue-500 dark:text-blue-400">
                            {PERIOD_OPTIONS.find(p => p.value === plan.billing_period)?.label}
                          </span>
                          <h3 className="text-lg font-extrabold text-gray-900 dark:text-white">{plan.name}</h3>
                        </div>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${plan.is_active ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'}`}>
                          {plan.is_active ? 'Ativo' : 'Inativo'}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 min-h-[32px]">{plan.description}</p>
                      <div className="mb-3">
                        <span className="text-2xl font-extrabold text-gray-900 dark:text-white">R$ {plan.price.toFixed(2)}</span>
                        <span className="text-xs text-gray-400">/{plan.period_months === 1 ? 'mês' : `${plan.period_months}m`}</span>
                      </div>
                      <p className="text-xs text-blue-600 dark:text-blue-400 font-semibold mb-2">{plan.max_stations} eletroposto{plan.max_stations > 1 ? 's' : ''}</p>
                      <ul className="space-y-1 mb-4">
                        {plan.features.slice(0, 3).map((f) => (
                          <li key={f} className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                            <svg className="w-3 h-3 text-blue-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                            {f}
                          </li>
                        ))}
                        {plan.features.length > 3 && <li className="text-[10px] text-gray-400">+{plan.features.length - 3} mais</li>}
                      </ul>
                      <div className="flex gap-1.5">
                        <button onClick={() => openEditPlan(plan)} className="flex-1 text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 py-2 rounded-lg font-semibold hover:bg-gray-200 dark:hover:bg-gray-700">Editar</button>
                        <button onClick={() => toggleActive(plan.id, plan.is_active)} className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 px-3 py-2 rounded-lg font-semibold hover:bg-gray-200 dark:hover:bg-gray-700">{plan.is_active ? 'Desativar' : 'Ativar'}</button>
                        <button onClick={() => deletePlan(plan.id)} className="text-xs bg-red-50 dark:bg-red-900/20 text-red-500 px-3 py-2 rounded-lg font-semibold hover:bg-red-100 dark:hover:bg-red-900/30">Excluir</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}

          {promoPlans.length > 0 && (
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                Divulgação EV
                <span className="text-[10px] bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 px-2 py-0.5 rounded-full font-bold uppercase">Promo</span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {promoPlans.map((plan) => (
                  <div key={plan.id} className={`glass-card p-4 !border-purple-200/50 dark:!border-purple-500/20 ${!plan.is_active ? 'opacity-50' : ''}`}>
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-lg font-extrabold text-gray-900 dark:text-white">{plan.name}</h3>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${plan.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                        {plan.is_active ? 'Ativo' : 'Inativo'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">{plan.description}</p>
                    <span className="text-2xl font-extrabold text-gray-900 dark:text-white">R$ {plan.price.toFixed(2)}</span>
                    <span className="text-xs text-gray-400">/mês</span>
                    <div className="flex gap-1.5 mt-4">
                      <button onClick={() => openEditPlan(plan)} className="flex-1 text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 py-2 rounded-lg font-semibold">Editar</button>
                      <button onClick={() => toggleActive(plan.id, plan.is_active)} className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 px-3 py-2 rounded-lg font-semibold">{plan.is_active ? 'Desativar' : 'Ativar'}</button>
                      <button onClick={() => deletePlan(plan.id)} className="text-xs bg-red-50 dark:bg-red-900/20 text-red-500 px-3 py-2 rounded-lg font-semibold">Excluir</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingPlan ? 'Editar Plano' : 'Novo Plano'}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Plano Base</label>
              <select
                value={form.base_plan}
                onChange={(e) => setForm({ ...form, base_plan: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none dark:bg-gray-700 dark:text-white text-sm"
              >
                {BASE_PLAN_OPTIONS.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Período</label>
              <select
                value={form.billing_period}
                onChange={(e) => setForm({ ...form, billing_period: e.target.value as BillingPeriod })}
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none dark:bg-gray-700 dark:text-white text-sm"
              >
                {PERIOD_OPTIONS.map(p => <option key={p.value} value={p.value}>{p.label} ({p.months} meses)</option>)}
              </select>
            </div>
          </div>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Nome do plano (ex: Básico Mensal)"
            className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none dark:bg-gray-700 dark:text-white text-sm"
          />
          <input
            type="text"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Descrição curta"
            className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none dark:bg-gray-700 dark:text-white text-sm"
          />
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Preço (R$)</label>
              <input type="number" step="0.01" value={form.price || ''}
                onChange={(e) => setForm({ ...form, price: parseFloat(e.target.value) || 0 })}
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none dark:bg-gray-700 dark:text-white text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Máx. Eletropostos</label>
              <input type="number" value={form.max_stations || ''}
                onChange={(e) => setForm({ ...form, max_stations: parseInt(e.target.value) || 1 })}
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none dark:bg-gray-700 dark:text-white text-sm" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Features (uma por linha)</label>
            <textarea
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none h-32 dark:bg-gray-700 dark:text-white text-sm"
              value={form.features}
              onChange={(e) => setForm({ ...form, features: e.target.value })}
              placeholder={"Até 3 eletropostos\nEstatísticas básicas\nSuporte por email"}
            />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.is_promo} onChange={(e) => setForm({ ...form, is_promo: e.target.checked })}
              className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500" />
            <span className="text-sm text-gray-700 dark:text-gray-300">Plano de Divulgação EV (promo)</span>
          </label>
          <button onClick={handleSubmit} className="w-full bg-blue-600 text-white py-2.5 rounded-xl font-bold text-sm hover:bg-blue-700 transition-colors">
            {editingPlan ? 'Salvar Alterações' : 'Criar Plano'}
          </button>
        </div>
      </Modal>
    </div>
  )
}
