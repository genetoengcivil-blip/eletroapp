import { supabase } from './supabase'
import type { TravelHistoryEntry } from './types'

export type { TravelHistoryEntry }

export async function getTravelHistory(userId: string): Promise<TravelHistoryEntry[]> {
  const { data, error } = await supabase
    .from('travel_history')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching history:', error)
    return []
  }
  return data || []
}

export async function addTravelHistory(userId: string, entry: Omit<TravelHistoryEntry, 'id' | 'created_at' | 'user_id'>): Promise<void> {
  const { error } = await supabase
    .from('travel_history')
    .insert({
      user_id: userId,
      origin: entry.origin,
      destination: entry.destination,
      origin_coords: entry.origin_coords,
      dest_coords: entry.dest_coords,
      distance_km: entry.distance_km,
      duration_minutes: entry.duration_minutes,
      charging_stops: entry.charging_stops,
      car_name: entry.car_name,
    })
  if (error) console.error('Error saving history:', error)
}

export async function clearTravelHistory(userId: string): Promise<void> {
  const { error } = await supabase
    .from('travel_history')
    .delete()
    .eq('user_id', userId)
  if (error) console.error('Error clearing history:', error)
}

export async function removeTravelHistoryEntry(userId: string, id: string): Promise<void> {
  const { error } = await supabase
    .from('travel_history')
    .delete()
    .eq('id', id)
    .eq('user_id', userId)
  if (error) console.error('Error removing entry:', error)
}

export function formatTravelDate(isoDate: string): string {
  const d = new Date(isoDate)
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })
}
