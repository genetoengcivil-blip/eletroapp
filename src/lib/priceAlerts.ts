import { supabase } from '../lib/supabase'
import type { ChargingStation } from './types'

export interface PriceAlert {
  id: string
  user_id: string
  station_id: string
  station_name: string
  target_price: number
  is_active: boolean
  created_at: string
}

export async function getPriceAlerts(userId: string): Promise<PriceAlert[]> {
  const { data, error } = await supabase
    .from('price_alerts')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching alerts:', error)
    return []
  }
  return data || []
}

export async function addPriceAlert(userId: string, stationId: string, stationName: string, targetPrice: number): Promise<void> {
  const { error } = await supabase
    .from('price_alerts')
    .upsert({
      user_id: userId,
      station_id: stationId,
      station_name: stationName,
      target_price: targetPrice,
      is_active: true,
      created_at: new Date().toISOString(),
    })
  if (error) console.error('Error saving alert:', error)
}

export async function removePriceAlert(userId: string, alertId: string): Promise<void> {
  const { error } = await supabase
    .from('price_alerts')
    .delete()
    .eq('id', alertId)
    .eq('user_id', userId)
  if (error) console.error('Error removing alert:', error)
}

export async function checkPriceAlerts(userId: string, stations: ChargingStation[]): Promise<{ alert: PriceAlert; currentPrice: number }[]> {
  const alerts = await getPriceAlerts(userId)
  const activeAlerts = alerts.filter(a => a.is_active)
  const triggered: { alert: PriceAlert; currentPrice: number }[] = []
  
  for (const alert of activeAlerts) {
    const station = stations.find(s => s.id === alert.station_id)
    if (station && !station.is_free && station.price_per_kwh <= alert.target_price) {
      triggered.push({ alert, currentPrice: station.price_per_kwh })
    }
  }
  return triggered
}
