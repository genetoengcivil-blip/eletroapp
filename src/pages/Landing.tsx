import { Link } from 'react-router-dom'
import { useThemeStore } from '../stores/themeStore'

const plans = [
  {
    name: 'Básico',
    price: 'R$ 49,90',
    period: '/mês',
    description: 'Ideal para quem tem poucos eletropostos',
    features: ['Até 3 eletropostos', 'Estatísticas básicas', 'Suporte por email'],
    highlighted: false,
  },
  {
    name: 'Pro',
    price: 'R$ 149,90',
    period: '/mês',
    description: 'Para operadores com vários pontos',
    features: ['Até 15 eletropostos', 'Estatísticas avançadas', 'Destaque nos resultados', 'Suporte prioritário'],
    highlighted: true,
  },
  {
    name: 'Enterprise',
    price: 'R$ 399,90',
    period: '/mês',
    description: 'Solução completa para grandes operadoras',
    features: ['Eletropostos ilimitados', 'Dashboard completo', 'API de integração', 'Gerente de conta dedicado', 'Suporte 24/7'],
    highlighted: false,
  },
]

const features = [
  {
    title: 'Mapa em Tempo Real',
    description: 'Visualize todos os eletropostos disponíveis no mapa interativo com informações atualizadas.',
    icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg>,
  },
  {
    title: 'Rota Inteligente',
    description: 'Planeje sua rota e encontre o eletroposto mais próximo do seu trajeto automaticamente.',
    icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
  },
  {
    title: 'Avaliações',
    description: 'Leia e deixe avaliações sobre os eletropostos para ajudar outros motoristas.',
    icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>,
  },
  {
    title: 'Para Proprietários',
    description: 'Cadastre seu eletroposto e alcance milhares de motoristas de veículos elétricos.',
    icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>,
  },
]

const stats = [
  { value: '500+', label: 'Eletropostos Cadastrados' },
  { value: '10k+', label: 'Motoristas Ativos' },
  { value: '50+', label: 'Cidades Cobertas' },
  { value: '4.8', label: 'Avaliação Média' },
]

export function Landing() {
  const { dark } = useThemeStore()

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-blue-600 via-blue-700 to-blue-900 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-blue-300 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 mb-6">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span className="text-sm text-blue-100">Disponível agora no Brasil</span>
            </div>
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              Encontre eletropostos<br />
              <span className="text-blue-200">em qualquer lugar</span>
            </h1>
            <p className="text-base sm:text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
              Planeje suas rotas e nunca fique sem carga. O EletroApp conecta motoristas
              a eletropostos por todo o Brasil.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/register" className="bg-white text-blue-700 font-semibold py-3.5 px-8 rounded-xl hover:bg-blue-50 transition-all text-lg shadow-lg shadow-blue-900/30">
                Comece Grátis
              </Link>
              <a href="#pricing" className="border-2 border-white/30 text-white font-semibold py-3.5 px-8 rounded-xl hover:bg-white/10 transition-all text-lg backdrop-blur-sm">
                Ver Planos
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-3xl sm:text-4xl font-bold text-blue-600 dark:text-blue-400">{stat.value}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 sm:py-20 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-4">Tudo que você precisa</h2>
            <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Ferramentas completas tanto para motoristas quanto para proprietários de eletropostos.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature) => (
              <div key={feature.title} className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center text-blue-600 dark:text-blue-400 mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{feature.title}</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 sm:py-20 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-4">Como funciona</h2>
            <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Simples, rápido e eficiente. Três passos para começar.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              { step: '1', title: 'Cadastre-se', desc: 'Crie sua conta gratuita em segundos' },
              { step: '2', title: 'Busque no Mapa', desc: 'Encontre eletropostos perto de você ou na sua rota' },
              { step: '3', title: 'Navegue até Lá', desc: 'Use Waze ou Google Maps para chegar ao eletroposto' },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center text-white text-xl font-bold mx-auto mb-4 shadow-lg shadow-blue-600/30">
                  {item.step}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{item.title}</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-16 sm:py-20 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-4">Planos para Proprietários</h2>
            <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Cadastre seus eletropostos e comece a receber motoristas. Escolha o plano ideal.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 max-w-5xl mx-auto">
            {plans.map((plan) => (
              <div key={plan.name} className={`rounded-2xl p-6 sm:p-8 transition-all ${
                plan.highlighted
                  ? 'bg-blue-600 text-white ring-4 ring-blue-400 shadow-xl shadow-blue-600/20 scale-[1.02]'
                  : 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700'
              }`}>
                {plan.highlighted && (
                  <span className="bg-blue-500 text-white text-xs font-bold px-3 py-1 rounded-full uppercase">
                    Mais Popular
                  </span>
                )}
                <h3 className={`text-xl font-bold mt-4 ${plan.highlighted ? '' : 'text-gray-900 dark:text-white'}`}>{plan.name}</h3>
                <p className={`text-sm mt-1 ${plan.highlighted ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'}`}>{plan.description}</p>
                <div className="mt-6">
                  <span className={`text-4xl font-bold ${plan.highlighted ? '' : 'text-gray-900 dark:text-white'}`}>{plan.price}</span>
                  <span className={plan.highlighted ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'}>{plan.period}</span>
                </div>
                <ul className="mt-8 space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm">
                      <svg className={`w-4 h-4 flex-shrink-0 ${plan.highlighted ? 'text-blue-200' : 'text-blue-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {feature}
                    </li>
                  ))}
                </ul>
                <Link to="/register" className={`block mt-8 text-center py-3 px-6 rounded-xl font-medium transition-all ${
                  plan.highlighted
                    ? 'bg-white text-blue-700 hover:bg-blue-50 shadow-lg'
                    : 'bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-600/20'
                }`}>
                  Começar Agora
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 sm:py-20 bg-gradient-to-br from-gray-900 to-gray-800">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
            Pronto para encontrar eletropostos?
          </h2>
          <p className="text-gray-400 mb-8 max-w-xl mx-auto">
            Cadastre-se gratuitamente e comece a usar hoje mesmo. Sem cartão de crédito.
          </p>
          <Link to="/register" className="bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3.5 px-8 rounded-xl transition-all text-lg inline-block shadow-lg shadow-blue-600/30">
            Criar Conta Grátis
          </Link>
        </div>
      </section>
    </div>
  )
}
