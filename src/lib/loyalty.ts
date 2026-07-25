import { supabase } from '../lib/supabase'

export interface LoyaltyPoints {
  totalPoints: number
  tripsCompleted: number
  stationsVisited: string[]
  lastUpdated: string
}

export async function getLoyaltyPoints(userId: string): Promise<LoyaltyPoints> {
  const { data, error } = await supabase
    .from('loyalty_points')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error || !data) {
    return { totalPoints: 0, tripsCompleted: 0, stationsVisited: [], lastUpdated: '' }
  }
  return data
}

export async function addTripPoints(userId: string, distanceKm: number, chargingStops: number, stationIds: string[]): Promise<LoyaltyPoints> {
  const loyalty = await getLoyaltyPoints(userId)
  const tripPoints = Math.round(distanceKm * 0.5 + chargingStops * 25)
  const newStations = stationIds.filter(id => !loyalty.stationsVisited.includes(id))
  const stationBonus = newStations.length * 10

  const updatedLoyalty = {
    totalPoints: loyalty.totalPoints + tripPoints + stationBonus,
    tripsCompleted: loyalty.tripsCompleted + 1,
    stationsVisited: [...loyalty.stationsVisited, ...newStations].slice(-100),
    lastUpdated: new Date().toISOString(),
  }

  const { data, error } = await supabase
    .from('loyalty_points')
    .upsert({ user_id: userId, ...updatedLoyalty })
    .select()
    .single()

  if (error) console.error('Error updating loyalty:', error)
  return data || updatedLoyalty
}

export async function addReviewPoints(userId: string, _stationId: string): Promise<LoyaltyPoints> {
  const loyalty = await getLoyaltyPoints(userId)
  const updatedLoyalty = {
    totalPoints: loyalty.totalPoints + 15,
    lastUpdated: new Date().toISOString(),
  }

  const { data, error } = await supabase
    .from('loyalty_points')
    .upsert({ user_id: userId, ...updatedLoyalty })
    .select()
    .single()

  if (error) console.error('Error updating loyalty:', error)
  return data || updatedLoyalty
}

export function getLoyaltyLevel(points: number): { name: string; color: string; nextLevel: number } {
  if (points >= 1000) return { name: 'Diamante', color: '#8b5cf6', nextLevel: 0 }
  if (points >= 500) return { name: 'Ouro', color: '#f59e0b', nextLevel: 1000 }
  if (points >= 200) return { name: 'Prata', color: '#94a3b8', nextLevel: 500 }
  if (points >= 50) return { name: 'Bronze', color: '#d97706', nextLevel: 200 }
  return { name: 'Iniciante', color: '#6b7280', nextLevel: 50 }
}

