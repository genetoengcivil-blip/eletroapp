import { useState } from 'react'

interface ElectricCar {
  id: string
  brand: string
  model: string
  year: number
  price: number
  autonomy: number
  battery: number
  powerKw: number
  connectors: string[]
  chargingTime: string
  category: 'hatch' | 'sedan' | 'suv' | 'pickup' | 'van'
  image: string
  highlights: string[]
}

const cars: ElectricCar[] = [
  { id: '1', brand: 'BYD', model: 'Dolphin', year: 2025, price: 179800, autonomy: 490, battery: 60.4, powerKw: 70, connectors: ['CCS', 'Type 2'], chargingTime: '30-80% em 30min', category: 'hatch', image: 'https://placehold.co/400x250/2563eb/ffffff?text=BYD+Dolphin', highlights: ['Mais vendido do Brasil', 'Autonomia excepcional', 'Câmera 360°'] },
  { id: '2', brand: 'BYD', model: 'Seal', year: 2025, price: 299800, autonomy: 520, battery: 82.56, powerKw: 150, connectors: ['CCS', 'Type 2'], chargingTime: '30-80% em 26min', category: 'sedan', image: 'https://placehold.co/400x250/1d4ed8/ffffff?text=BYD+Seal', highlights: ['0-100 em 3.8s', 'AWD disponível', 'Premium interior'] },
  { id: '3', brand: 'BYD', model: 'Song Plus', year: 2025, price: 269800, autonomy: 502, battery: 71.8, powerKw: 115, connectors: ['CCS', 'Type 2'], chargingTime: '30-80% em 30min', category: 'suv', image: 'https://placehold.co/400x250/1e40af/ffffff?text=BYD+Song+', highlights: ['SUV espaçoso', 'Tração integral', 'Tela 15.6"'] },
  { id: '4', brand: 'Tesla', model: 'Model 3', year: 2025, price: 259990, autonomy: 510, battery: 60, powerKw: 170, connectors: ['CCS', 'Type 2'], chargingTime: '20-80% em 25min', category: 'sedan', image: 'https://placehold.co/400x250/dc2626/ffffff?text=Tesla+Model+3', highlights: ['Supercharger network', 'Autopilot', 'OTA updates'] },
  { id: '5', brand: 'Tesla', model: 'Model Y', year: 2025, price: 319990, autonomy: 455, battery: 75, powerKw: 170, connectors: ['CCS', 'Type 2'], chargingTime: '20-80% em 25min', category: 'suv', image: 'https://placehold.co/400x250/b91c1c/ffffff?text=Tesla+Model+Y', highlights: ['SUV best-seller', '7 lugares', 'Autopilot'] },
  { id: '6', brand: 'Hyundai', model: 'Ioniq 5', year: 2025, price: 299990, autonomy: 507, battery: 77.4, powerKw: 239, connectors: ['CCS', 'Type 2'], chargingTime: '10-80% em 18min', category: 'suv', image: 'https://placehold.co/400x250/0891b2/ffffff?text=Ioniq+5', highlights: ['Carregamento ultra-rápido', 'V2L (casa)', 'Design retrô'] },
  { id: '7', brand: 'Kia', model: 'EV6', year: 2025, price: 289990, autonomy: 528, battery: 77.4, powerKw: 239, connectors: ['CCS', 'Type 2'], chargingTime: '10-80% em 18min', category: 'suv', image: 'https://placehold.co/400x250/0d9488/ffffff?text=Kia+EV6', highlights: ['Mesma plataforma Ioniq', 'Design agressivo', 'V2L'] },
  { id: '8', brand: 'Volkswagen', model: 'ID.4', year: 2025, price: 279990, autonomy: 452, battery: 77, powerKw: 150, connectors: ['CCS', 'Type 2'], chargingTime: '30-80% em 36min', category: 'suv', image: 'https://placehold.co/400x250/2563eb/ffffff?text=VW+ID.4', highlights: ['Qualidade alemã', 'Espaço interno', 'AR HUD'] },
  { id: '9', brand: 'Chevrolet', model: 'Equinox EV', year: 2025, price: 249990, autonomy: 513, battery: 85, powerKw: 150, connectors: ['CCS', 'Type 2'], chargingTime: '30-80% em 30min', category: 'suv', image: 'https://placehold.co/400x250/ca8a04/ffffff?text=Equinox+EV', highlights: ['SUV acessível', 'Boa autonomia', 'Super Cruise'] },
  { id: '10', brand: 'Volvo', model: 'EX30', year: 2025, price: 229990, autonomy: 450, battery: 69, powerKw: 185, connectors: ['CCS', 'Type 2'], chargingTime: '10-80% em 26min', category: 'hatch', image: 'https://placehold.co/400x250/166534/ffffff?text=Volvo+EX30', highlights: ['0-100 em 3.6s', 'Compacto premium', 'Google built-in'] },
  { id: '11', brand: 'Peugeot', model: 'e-208', year: 2025, price: 189990, autonomy: 362, battery: 51, powerKw: 100, connectors: ['CCS', 'Type 2'], chargingTime: '10-80% em 30min', category: 'hatch', image: 'https://placehold.co/400x250/4338ca/ffffff?text=Peugeot+e-208', highlights: ['Design francês', 'i-Cockpit', 'Compacto ágil'] },
  { id: '12', brand: 'Fiat', model: '500e', year: 2025, price: 169990, autonomy: 320, battery: 42, powerKw: 88, connectors: ['CCS', 'Type 2'], chargingTime: '10-80% em 26min', category: 'hatch', image: 'https://placehold.co/400x250/e11d48/ffffff?text=Fiat+500e', highlights: ['Ícone italiano', 'Urbano perfeito', 'Level 2 autonomy'] },
  { id: '13', brand: 'Citroën', model: 'ë-C4', year: 2025, price: 179990, autonomy: 360, battery: 50, powerKw: 100, connectors: ['CCS', 'Type 2'], chargingTime: '10-80% em 30min', category: 'hatch', image: 'https://placehold.co/400x250/7c3aed/ffffff?text=Citroën+ë-C4', highlights: ['Conforto único', 'Suspensão hidráulica', 'Acessível'] },
  { id: '14', brand: 'BMW', model: 'iX3', year: 2025, price: 449990, autonomy: 460, battery: 74, powerKw: 210, connectors: ['CCS', 'Type 2'], chargingTime: '10-80% em 32min', category: 'suv', image: 'https://placehold.co/400x250/1e3a8a/ffffff?text=BMW+iX3', highlights: ['Luxo premium', 'iDrive 8', 'Harman Kardon'] },
  { id: '15', brand: 'Mercedes', model: 'EQA', year: 2025, price: 399990, autonomy: 474, battery: 70.5, powerKw: 140, connectors: ['CCS', 'Type 2'], chargingTime: '10-80% em 30min', category: 'suv', image: 'https://placehold.co/400x250/374151/ffffff?text=Mercedes+EQA', highlights: ['Luxo compacto', 'MBUX', '64 cores LED'] },
  { id: '16', brand: 'Nissan', model: 'Leaf', year: 2025, price: 229990, autonomy: 270, battery: 40, powerKw: 110, connectors: ['CHAdeMO', 'Type 2'], chargingTime: '10-80% em 40min', category: 'hatch', image: 'https://placehold.co/400x250/15803d/ffffff?text=Nissan+Leaf', highlights: ['Pioneiro EV', 'e-Pedal', 'ProPILOT'] },
]

const categories = [
  { id: 'all', label: 'Todos', icon: '🚗' },
  { id: 'hatch', label: 'Hatch', icon: '🏎️' },
  { id: 'sedan', label: 'Sedan', icon: '🚘' },
  { id: 'suv', label: 'SUV', icon: '🚙' },
]

const priceRanges: { id: string; label: string; min?: number; max?: number }[] = [
  { id: 'all', label: 'Todos os preços' },
  { id: 'under200', label: 'Até R$200k', min: 0, max: 200000 },
  { id: '200to300', label: 'R$200k-300k', min: 200000, max: 300000 },
  { id: 'above300', label: 'Acima de R$300k', min: 300000, max: 999999999 },
]

export function Marketplace() {
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedPrice, setSelectedPrice] = useState('all')
  const [sortBy, setSortBy] = useState<'price' | 'autonomy' | 'power'>('price')
  const [compareMode, setCompareMode] = useState(false)
  const [compareList, setCompareList] = useState<string[]>([])

  const filtered = cars.filter(car => {
    if (selectedCategory !== 'all' && car.category !== selectedCategory) return false
    const range = priceRanges.find(r => r.id === selectedPrice)
    if (range && range.id !== 'all' && range.min != null && range.max != null) {
      if (car.price < range.min || car.price > range.max) return false
    }
    return true
  }).sort((a, b) => {
    if (sortBy === 'price') return a.price - b.price
    if (sortBy === 'autonomy') return b.autonomy - a.autonomy
    return b.powerKw - a.powerKw
  })

  const toggleCompare = (id: string) => {
    if (compareList.includes(id)) {
      setCompareList(compareList.filter(i => i !== id))
    } else if (compareList.length < 3) {
      setCompareList([...compareList, id])
    }
  }

  const compareCars = cars.filter(c => compareList.includes(c.id))

  const formatPrice = (price: number) => `R$ ${(price / 1000).toFixed(0)}k`

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Hero */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white">
        <div className="max-w-7xl mx-auto px-4 py-10 sm:py-14">
          <h1 className="text-2xl sm:text-4xl font-bold mb-2">Marketplace de Carros Elétricos</h1>
          <p className="text-blue-100 text-sm sm:text-base max-w-2xl">Compare especificações, preços e encontre o carro elétrico ideal para o seu estilo de vida. Todos compatíveis com a rede EletroApp.</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 mb-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex flex-wrap items-center gap-4">
            {/* Categories */}
            <div className="flex gap-1 bg-gray-100 dark:bg-gray-700 rounded-xl p-1">
              {categories.map(cat => (
                <button key={cat.id} onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    selectedCategory === cat.id
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}>
                  {cat.icon} {cat.label}
                </button>
              ))}
            </div>

            <div className="h-6 w-px bg-gray-200 dark:bg-gray-600" />

            {/* Price */}
            <select value={selectedPrice} onChange={e => setSelectedPrice(e.target.value)}
              className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-xl text-xs bg-white dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none">
              {priceRanges.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
            </select>

            {/* Sort */}
            <select value={sortBy} onChange={e => setSortBy(e.target.value as 'price' | 'autonomy' | 'power')}
              className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-xl text-xs bg-white dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none">
              <option value="price">Menor preço</option>
              <option value="autonomy">Maior autonomia</option>
              <option value="power">Maior potência</option>
            </select>

            <div className="ml-auto">
              <button onClick={() => { setCompareMode(!compareMode); if (compareMode) setCompareList([]) }}
                className={`px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                  compareMode ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                }`}>
                Comparar {compareList.length > 0 ? `(${compareList.length}/3)` : ''}
              </button>
            </div>
          </div>
        </div>

        {/* Car Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(car => (
            <div key={car.id}
              className={`bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-sm border transition-all hover:shadow-lg ${
                compareList.includes(car.id) ? 'border-blue-500 ring-2 ring-blue-200 dark:ring-blue-800' : 'border-gray-100 dark:border-gray-700'
              }`}>
              {/* Image */}
              <div className="relative">
                <img src={car.image} alt={`${car.brand} ${car.model}`} className="w-full h-44 object-cover" />
                <div className="absolute top-3 left-3">
                  <span className="bg-white/90 backdrop-blur-sm text-gray-800 text-[10px] font-bold px-2 py-1 rounded-lg">
                    {car.year}
                  </span>
                </div>
                {compareMode && (
                  <button onClick={() => toggleCompare(car.id)}
                    className={`absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                      compareList.includes(car.id) ? 'bg-blue-600 text-white' : 'bg-white/90 backdrop-blur-sm text-gray-600 hover:bg-blue-100'
                    }`}>
                    {compareList.includes(car.id) ? '✓' : '+'}
                  </button>
                )}
              </div>

              {/* Info */}
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase tracking-wider font-medium">{car.brand}</p>
                    <h3 className="text-base font-bold text-gray-900 dark:text-white">{car.model}</h3>
                  </div>
                  <p className="text-sm font-bold text-blue-600 dark:text-blue-400">{formatPrice(car.price)}</p>
                </div>

                {/* Specs */}
                <div className="grid grid-cols-3 gap-2 mb-3">
                  <div className="text-center p-1.5 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <div className="text-xs font-bold text-gray-900 dark:text-white">{car.autonomy}</div>
                    <div className="text-[9px] text-gray-400">km autonomia</div>
                  </div>
                  <div className="text-center p-1.5 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <div className="text-xs font-bold text-gray-900 dark:text-white">{car.powerKw}kW</div>
                    <div className="text-[9px] text-gray-400">potência</div>
                  </div>
                  <div className="text-center p-1.5 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <div className="text-xs font-bold text-gray-900 dark:text-white">{car.battery}</div>
                    <div className="text-[9px] text-gray-400">kWh bateria</div>
                  </div>
                </div>

                {/* Connectors */}
                <div className="flex items-center gap-1 mb-2">
                  {car.connectors.map(c => (
                    <span key={c} className="text-[9px] px-1.5 py-0.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded font-medium">{c}</span>
                  ))}
                  <span className="text-[9px] text-gray-400 ml-auto">{car.chargingTime}</span>
                </div>

                {/* Highlights */}
                <div className="flex flex-wrap gap-1">
                  {car.highlights.slice(0, 2).map(h => (
                    <span key={h} className="text-[9px] px-1.5 py-0.5 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded font-medium">{h}</span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Compare Panel */}
        {compareMode && compareCars.length >= 2 && (
          <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-2xl z-50 p-4">
            <div className="max-w-5xl mx-auto">
              <div className="grid grid-cols-3 gap-4">
                {compareCars.map(car => (
                  <div key={car.id} className="text-center">
                    <p className="text-xs font-bold text-gray-900 dark:text-white">{car.brand} {car.model}</p>
                    <div className="mt-2 space-y-1 text-[11px]">
                      <div className="flex justify-between"><span className="text-gray-500">Preço:</span><span className="font-semibold">{formatPrice(car.price)}</span></div>
                      <div className="flex justify-between"><span className="text-gray-500">Autonomia:</span><span className="font-semibold">{car.autonomy}km</span></div>
                      <div className="flex justify-between"><span className="text-gray-500">Potência:</span><span className="font-semibold">{car.powerKw}kW</span></div>
                      <div className="flex justify-between"><span className="text-gray-500">Bateria:</span><span className="font-semibold">{car.battery}kWh</span></div>
                      <div className="flex justify-between"><span className="text-gray-500">Carga:</span><span className="font-semibold">{car.chargingTime}</span></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Cost Calculator CTA */}
        <div className="mt-8 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl p-6 text-white">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="flex-1">
              <h3 className="text-lg font-bold mb-1">Calculadora de Custos</h3>
              <p className="text-green-100 text-sm">Descubra quanto você economiza com um carro elétrico vs. um carro a combustão.</p>
            </div>
            <div className="flex gap-3 items-center">
              <div className="bg-white/20 rounded-xl px-4 py-3 text-center">
                <div className="text-2xl font-bold">67%</div>
                <div className="text-[10px] text-green-100">economia no combustível</div>
              </div>
              <div className="bg-white/20 rounded-xl px-4 py-3 text-center">
                <div className="text-2xl font-bold">80%</div>
                <div className="text-[10px] text-green-100">menos manutenção</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
