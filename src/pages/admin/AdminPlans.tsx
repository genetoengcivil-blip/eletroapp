import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import type { SubscriptionPlan } from '../../lib/types'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Modal } from '../../components/ui/Modal'

export function AdminPlans() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null)

  const [form, setForm] = useState({
    name: '',
    description: '',
    price: 0,
    max_stations: 1,
    features: '',
  })

  useEffect(() => {
    fetchPlans()
  }, [])

  const fetchPlans = async () => {
    const { data } = await supabase
      .from('subscription_plans')
      .select('*')
      .order('price')
    if (data) setPlans(data)
    setLoading(false)
  }

  const openNewPlan = () => {
    setEditingPlan(null)
    setForm({ name: '', description: '', price: 0, max_stations: 1, features: '' })
    setShowModal(true)
  }

  const openEditPlan = (plan: SubscriptionPlan) => {
    setEditingPlan(plan)
    setForm({
      name: plan.name,
      description: plan.description,
      price: plan.price,
      max_stations: plan.max_stations,
      features: plan.features.join('\n'),
    })
    setShowModal(true)
  }

  const handleSubmit = async () => {
    const planData = {
      name: form.name,
      description: form.description,
      price: form.price,
      max_stations: form.max_stations,
      features: form.features.split('\n').filter(Boolean),
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

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Gerenciar Planos</h1>
        <Button onClick={openNewPlan}>+ Novo Plano</Button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">Carregando...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <Card key={plan.id} className={`relative ${!plan.is_active ? 'opacity-60' : ''}`}>
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">{plan.name}</h3>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                  plan.is_active ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
                }`}>
                  {plan.is_active ? 'Ativo' : 'Inativo'}
                </span>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{plan.description}</p>
              <div className="mb-4">
                <span className="text-3xl font-bold text-gray-900 dark:text-white">R$ {plan.price}</span>
                <span className="text-gray-500 dark:text-gray-400">/mês</span>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">Até {plan.max_stations} eletropostos</p>
              <ul className="space-y-1 mb-6">
                {plan.features.map((f) => (
                  <li key={f} className="text-sm text-gray-600 dark:text-gray-300 flex items-center gap-1">
                    <svg className="w-3.5 h-3.5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>
              <div className="flex gap-2">
                <Button variant="secondary" className="text-xs flex-1" onClick={() => openEditPlan(plan)}>
                  Editar
                </Button>
                <Button variant="ghost" className="text-xs" onClick={() => toggleActive(plan.id, plan.is_active)}>
                  {plan.is_active ? 'Desativar' : 'Ativar'}
                </Button>
                <Button variant="danger" className="text-xs" onClick={() => deletePlan(plan.id)}>
                  Excluir
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingPlan ? 'Editar Plano' : 'Novo Plano'}>
        <div className="space-y-4">
          <Input label="Nome" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Input label="Descrição" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Preço (R$)" type="number" step="0.01" value={form.price || ''} onChange={(e) => setForm({ ...form, price: parseFloat(e.target.value) || 0 })} />
            <Input label="Máx. Eletropostos" type="number" value={form.max_stations || ''} onChange={(e) => setForm({ ...form, max_stations: parseInt(e.target.value) || 1 })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Features (uma por linha)</label>
            <textarea
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none h-32 dark:bg-gray-700 dark:text-white"
              value={form.features}
              onChange={(e) => setForm({ ...form, features: e.target.value })}
              placeholder={"Até 3 eletropostos\nEstatísticas básicas\nSuporte por email"}
            />
          </div>
          <Button onClick={handleSubmit} className="w-full">
            {editingPlan ? 'Salvar Alterações' : 'Criar Plano'}
          </Button>
        </div>
      </Modal>
    </div>
  )
}
