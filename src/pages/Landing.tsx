import { Link } from 'react-router-dom'

const plans = [
  {
    name: 'Básico',
    price: '49,90',
    period: '/mês',
    description: 'Ideal para quem tem poucos eletropostos',
    features: ['Até 3 eletropostos', 'Estatísticas básicas', 'Suporte por email'],
    highlighted: false,
  },
  {
    name: 'Profissional',
    price: '149,90',
    period: '/mês',
    description: 'Para operadores com vários pontos',
    features: ['Até 15 eletropostos', 'Estatísticas avançadas', 'Destaque nos resultados', 'Suporte prioritário'],
    highlighted: true,
  },
  {
    name: 'Empresarial',
    price: '399,90',
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
    icon: 'M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7',
    gradient: 'from-blue-500 to-cyan-400',
  },
  {
    title: 'Planejador de Viagem',
    description: 'Configure seu carro elétrico, SOC e o sistema calcula as paradas ideais automaticamente.',
    icon: 'M13 10V3L4 14h7v7l9-11h-7z',
    gradient: 'from-amber-500 to-orange-400',
  },
  {
    title: 'Marketplace EV',
    description: 'Compare carros elétricos, preços, autonomia e encontre o ideal para você.',
    icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
    gradient: 'from-purple-500 to-pink-400',
  },
  {
    title: 'Avaliações & Reviews',
    description: 'Leia e deixe avaliações com fotos para ajudar outros motoristas.',
    icon: 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z',
    gradient: 'from-emerald-500 to-teal-400',
  },
]

const stats = [
  { value: '857', suffix: '+', label: 'Eletropostos', gradient: 'from-blue-600 to-cyan-500' },
  { value: '27', suffix: '', label: 'Estados', gradient: 'from-purple-600 to-pink-500' },
  { value: '75', suffix: '+', label: 'Cidades', gradient: 'from-amber-500 to-orange-500' },
  { value: '4.8', suffix: '', label: 'Avaliação', gradient: 'from-emerald-500 to-teal-400' },
]

export function Landing() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-900 text-white overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-72 h-72 bg-cyan-400/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-blue-300/8 rounded-full blur-3xl" style={{ animation: 'pulse 4s ease-in-out infinite 1s' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-white/3 rounded-full blur-3xl" />
          {/* Floating EV icons */}
          <div className="absolute top-32 right-[15%] text-white/10 text-6xl" style={{ animation: 'float 6s ease-in-out infinite' }}>⚡</div>
          <div className="absolute bottom-32 left-[15%] text-white/10 text-5xl" style={{ animation: 'float 5s ease-in-out infinite 1s' }}>🔋</div>
          <div className="absolute top-1/3 left-[10%] text-white/8 text-4xl" style={{ animation: 'float 7s ease-in-out infinite 2s' }}>🚗</div>
        </div>
        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '32px 32px' }} />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32 lg:py-40">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/10 px-5 py-2.5 rounded-full mb-8">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span className="text-sm text-blue-100 font-semibold">857 eletropostos ativos no Brasil</span>
            </div>
            <h1 className="text-5xl sm:text-6xl lg:text-8xl font-extrabold mb-8 leading-[0.95] tracking-tighter">
              Encontre
              <br />
              <span className="bg-gradient-to-r from-cyan-300 via-blue-200 to-white bg-clip-text text-transparent">
                eletropostos
              </span>
              <br />
              <span className="text-blue-200/80">em qualquer lugar</span>
            </h1>
            <p className="text-lg sm:text-xl text-blue-100/70 mb-12 max-w-2xl mx-auto leading-relaxed">
              Planeje suas rotas e nunca fique sem carga. O EletroApp conecta motoristas
              a eletropostos por todo o Brasil — com mapa, avaliações e planejador de viagem.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/register"
                className="group relative bg-white text-blue-700 font-bold py-4.5 px-10 rounded-2xl hover:bg-blue-50 transition-all duration-300 text-lg shadow-2xl shadow-blue-900/30 hover:shadow-3xl hover:-translate-y-1">
                <span className="relative z-10 flex items-center gap-2 justify-center">
                  Comece Grátis
                  <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                </span>
              </Link>
              <a href="#pricing"
                className="border-2 border-white/20 text-white font-semibold py-4.5 px-10 rounded-2xl hover:bg-white/10 hover:border-white/30 transition-all duration-300 text-lg backdrop-blur-sm">
                Ver Planos
              </a>
            </div>
          </div>
        </div>
        {/* Bottom wave */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 60" fill="none" className="w-full"><path d="M0 60V30C240 0 480 0 720 30C960 60 1200 60 1440 30V60H0Z" fill="currentColor" className="text-gray-50 dark:text-gray-900" /></svg>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            {stats.map((stat) => (
              <div key={stat.label} className="glass-card p-5 sm:p-6 text-center group hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
                <p className={`text-3xl sm:text-4xl font-extrabold bg-gradient-to-r ${stat.gradient} bg-clip-text text-transparent`}>
                  {stat.value}<span className="text-2xl">{stat.suffix}</span>
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1.5 font-semibold">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 sm:py-28 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-sm font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest">Funcionalidades</span>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-gray-900 dark:text-white mt-3 tracking-tight">Tudo que você precisa</h2>
            <p className="text-gray-500 dark:text-gray-400 max-w-2xl mx-auto mt-4 text-lg">
              Ferramentas completas tanto para motoristas quanto para proprietários de eletropostos.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {features.map((feature, i) => (
              <div key={feature.title} className="glass-card p-6 group hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 cursor-default" style={{ animationDelay: `${i * 100}ms` }}>
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center text-white mb-5 shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-500`}>
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={feature.icon} /></svg>
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{feature.title}</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 sm:py-28 bg-gray-50 dark:bg-gray-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-sm font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest">Como funciona</span>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-gray-900 dark:text-white mt-3 tracking-tight">Simples e eficiente</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              { step: '01', title: 'Cadastre-se', desc: 'Crie sua conta gratuita em segundos', gradient: 'from-cyan-500 to-blue-600', icon: 'M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z' },
              { step: '02', title: 'Busque no Mapa', desc: 'Encontre eletropostos perto de você ou na sua rota', gradient: 'from-blue-600 to-indigo-600', icon: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z' },
              { step: '03', title: 'Navegue até Lá', desc: 'Use Waze ou Google Maps para chegar ao eletroposto', gradient: 'from-indigo-600 to-purple-600', icon: 'M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7' },
            ].map((item, i) => (
              <div key={item.step} className="text-center group relative">
                {i < 2 && <div className="hidden md:block absolute top-8 left-[60%] w-[80%] h-0.5 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600" />}
                <div className={`w-20 h-20 rounded-3xl bg-gradient-to-br ${item.gradient} flex items-center justify-center text-white mx-auto mb-6 shadow-xl group-hover:scale-110 group-hover:rotate-3 transition-all duration-500`}>
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={item.icon} /></svg>
                </div>
                <span className="text-xs font-bold text-blue-500 dark:text-blue-400 uppercase tracking-widest">Passo {item.step}</span>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mt-2 mb-2">{item.title}</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 sm:py-28 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-sm font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest">Preços</span>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-gray-900 dark:text-white mt-3 tracking-tight">Planos para Proprietários</h2>
            <p className="text-gray-500 dark:text-gray-400 max-w-2xl mx-auto mt-4 text-lg">
              Cadastre seus eletropostos e comece a receber motoristas.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 max-w-5xl mx-auto items-start">
            {plans.map((plan) => (
              <div key={plan.name} className={`rounded-3xl p-7 sm:p-8 transition-all duration-500 ${
                plan.highlighted
                  ? 'bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white ring-2 ring-blue-400/50 shadow-2xl shadow-blue-600/30 scale-[1.05] relative z-10'
                  : 'glass-card hover:shadow-2xl hover:-translate-y-2'
              }`}>
                {plan.highlighted && (
                  <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-cyan-400 to-blue-400 text-white text-xs font-bold px-5 py-1.5 rounded-full shadow-lg">
                    Mais Popular
                  </span>
                )}
                <h3 className={`text-xl font-bold mt-2 ${plan.highlighted ? '' : 'text-gray-900 dark:text-white'}`}>{plan.name}</h3>
                <p className={`text-sm mt-1 ${plan.highlighted ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'}`}>{plan.description}</p>
                <div className="mt-6 flex items-baseline gap-1">
                  <span className={`text-sm ${plan.highlighted ? 'text-blue-200' : 'text-gray-400'}`}>R$</span>
                  <span className={`text-4xl font-extrabold ${plan.highlighted ? '' : 'text-gray-900 dark:text-white'}`}>{plan.price}</span>
                  <span className={`text-sm ${plan.highlighted ? 'text-blue-200' : 'text-gray-500 dark:text-gray-400'}`}>{plan.period}</span>
                </div>
                <ul className="mt-8 space-y-3.5">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2.5 text-sm">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${plan.highlighted ? 'bg-white/20' : 'bg-blue-100 dark:bg-blue-900/30'}`}>
                        <svg className={`w-3 h-3 ${plan.highlighted ? 'text-white' : 'text-blue-600 dark:text-blue-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <span className={plan.highlighted ? 'text-blue-50' : 'text-gray-600 dark:text-gray-400'}>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link to="/register" className={`block mt-8 text-center py-4 px-6 rounded-xl font-bold transition-all duration-300 ${
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
      <section className="py-20 sm:py-28 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-900 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-10 left-1/4 w-72 h-72 bg-cyan-400/10 rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-blue-300/8 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white mb-6 tracking-tight">
            Pronto para encontrar<br />eletropostos?
          </h2>
          <p className="text-blue-100/70 mb-12 max-w-xl mx-auto text-lg">
            Cadastre-se gratuitamente e comece a usar hoje mesmo. Sem cartão de crédito.
          </p>
          <Link to="/register"
            className="inline-block bg-white text-blue-700 font-bold py-4.5 px-12 rounded-2xl text-lg hover:bg-blue-50 transition-all duration-300 shadow-2xl shadow-blue-900/30 hover:shadow-3xl hover:-translate-y-1">
            Criar Conta Grátis
          </Link>
        </div>
      </section>
    </div>
  )
}
