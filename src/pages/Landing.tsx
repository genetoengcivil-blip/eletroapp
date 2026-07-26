import { Link } from 'react-router-dom'

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
    description: 'Visualize 857+ eletropostos em todo o Brasil no mapa interativo com status em tempo real.',
    icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg>,
  },
  {
    title: 'Planejador de Viagem',
    description: 'Configure seu carro elétrico, SOC e o sistema calcula as paradas ideais automaticamente.',
    icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>,
  },
  {
    title: 'Marketplace EV',
    description: 'Compare carros elétricos, preços, autonomia e encontre o ideal para você.',
    icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>,
  },
  {
    title: 'Avaliações & Reviews',
    description: 'Leia e deixe avaliações com fotos para ajudar outros motoristas.',
    icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>,
  },
]

const stats = [
  { value: '857+', label: 'Eletropostos Cadastrados' },
  { value: '27', label: 'Estados Cobertos' },
  { value: '75+', label: 'Cidades Mapeadas' },
  { value: '4.8', label: 'Avaliação Média' },
]

export function Landing() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-blue-600 via-blue-700 to-blue-900 text-white overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-blue-300/8 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-white/3 rounded-full blur-3xl" />
        </div>
        {/* Grid pattern overlay */}
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '40px 40px' }} />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28 lg:py-36">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 glass-badge px-4 py-2 mb-8">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span className="text-sm text-blue-100 font-medium">Disponível agora no Brasil</span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-extrabold mb-6 leading-[1.1] tracking-tight">
              Encontre eletropostos
              <br />
              <span className="text-blue-200">em qualquer lugar</span>
            </h1>
            <p className="text-base sm:text-lg text-blue-100/80 mb-10 max-w-xl mx-auto leading-relaxed">
              Planeje suas rotas e nunca fique sem carga. O EletroApp conecta motoristas
              a eletropostos por todo o Brasil.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/register"
                className="group relative bg-white text-blue-700 font-semibold py-4 px-8 rounded-2xl hover:bg-blue-50 transition-all duration-300 text-lg shadow-xl shadow-blue-900/20 hover:shadow-2xl hover:shadow-blue-900/30 hover:-translate-y-0.5">
                <span className="relative z-10">Comece Grátis</span>
              </Link>
              <a href="#pricing"
                className="border-2 border-white/20 text-white font-semibold py-4 px-8 rounded-2xl hover:bg-white/10 hover:border-white/30 transition-all duration-300 text-lg backdrop-blur-sm">
                Ver Planos
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-14 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center group">
                <p className="text-3xl sm:text-4xl font-extrabold text-blue-600 dark:text-blue-400 tracking-tight">{stat.value}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1.5 font-medium">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 sm:py-28 bg-gray-50 dark:bg-gray-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-sm font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">Funcionalidades</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white mt-3 tracking-tight">Tudo que você precisa</h2>
            <p className="text-gray-500 dark:text-gray-400 max-w-2xl mx-auto mt-4 text-lg">
              Ferramentas completas tanto para motoristas quanto para proprietários de eletropostos.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {features.map((feature) => (
              <div key={feature.title} className="glass-card p-6 group hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 mb-5 group-hover:bg-blue-100 dark:group-hover:bg-blue-800/40 transition-colors">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{feature.title}</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 sm:py-28 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-sm font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">Como funciona</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white mt-3 tracking-tight">Simples e eficiente</h2>
            <p className="text-gray-500 dark:text-gray-400 max-w-2xl mx-auto mt-4 text-lg">
              Três passos para começar a usar.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              { step: '1', title: 'Cadastre-se', desc: 'Crie sua conta gratuita em segundos', color: 'from-blue-500 to-blue-700' },
              { step: '2', title: 'Busque no Mapa', desc: 'Encontre eletropostos perto de você ou na sua rota', color: 'from-blue-600 to-blue-800' },
              { step: '3', title: 'Navegue até Lá', desc: 'Use Waze ou Google Maps para chegar ao eletroposto', color: 'from-blue-700 to-blue-900' },
            ].map((item) => (
              <div key={item.step} className="text-center group">
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center text-white text-xl font-bold mx-auto mb-5 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  {item.step}
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{item.title}</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 sm:py-28 bg-gray-50 dark:bg-gray-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-sm font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">Preços</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white mt-3 tracking-tight">Planos para Proprietários</h2>
            <p className="text-gray-500 dark:text-gray-400 max-w-2xl mx-auto mt-4 text-lg">
              Cadastre seus eletropostos e comece a receber motoristas.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 max-w-5xl mx-auto">
            {plans.map((plan) => (
              <div key={plan.name} className={`rounded-3xl p-7 sm:p-8 transition-all duration-300 ${
                plan.highlighted
                  ? 'bg-gradient-to-br from-blue-600 to-blue-700 text-white ring-2 ring-blue-400/50 shadow-2xl shadow-blue-600/25 scale-[1.03] relative z-10'
                  : 'glass-card hover:shadow-xl hover:-translate-y-1'
              }`}>
                {plan.highlighted && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-white text-blue-700 text-xs font-bold px-4 py-1 rounded-full shadow-lg">
                    Mais Popular
                  </span>
                )}
                <h3 className={`text-xl font-bold mt-2 ${plan.highlighted ? '' : 'text-gray-900 dark:text-white'}`}>{plan.name}</h3>
                <p className={`text-sm mt-1 ${plan.highlighted ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'}`}>{plan.description}</p>
                <div className="mt-6 flex items-baseline gap-1">
                  <span className={`text-4xl font-extrabold ${plan.highlighted ? '' : 'text-gray-900 dark:text-white'}`}>{plan.price}</span>
                  <span className={`text-sm ${plan.highlighted ? 'text-blue-200' : 'text-gray-500 dark:text-gray-400'}`}>{plan.period}</span>
                </div>
                <ul className="mt-8 space-y-3.5">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2.5 text-sm">
                      <svg className={`w-4 h-4 flex-shrink-0 ${plan.highlighted ? 'text-blue-200' : 'text-blue-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className={plan.highlighted ? 'text-blue-50' : 'text-gray-600 dark:text-gray-400'}>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link to="/register" className={`block mt-8 text-center py-3.5 px-6 rounded-xl font-semibold transition-all duration-300 ${
                  plan.highlighted
                    ? 'bg-white text-blue-700 hover:bg-blue-50 shadow-lg hover:shadow-xl'
                    : 'bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-600/20 hover:shadow-lg'
                }`}>
                  Começar Agora
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 sm:py-28 bg-gradient-to-br from-blue-600 via-blue-700 to-blue-900 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-1/4 w-72 h-72 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-blue-300 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4 tracking-tight">
            Pronto para encontrar eletropostos?
          </h2>
          <p className="text-blue-100/70 mb-10 max-w-xl mx-auto text-lg">
            Cadastre-se gratuitamente e comece a usar hoje mesmo. Sem cartão de crédito.
          </p>
          <Link to="/register"
            className="inline-block bg-white text-blue-700 font-semibold py-4 px-10 rounded-2xl text-lg hover:bg-blue-50 transition-all duration-300 shadow-xl shadow-blue-900/20 hover:shadow-2xl hover:-translate-y-0.5">
            Criar Conta Grátis
          </Link>
        </div>
      </section>
    </div>
  )
}
