export type UserRole = 'user' | 'subscriber' | 'admin'
export type BillingPeriod = 'monthly' | 'semester' | 'annual'

export interface Profile {
  id: string
  full_name: string
  avatar_url: string | null
  role: UserRole
  created_at: string
}

export interface SubscriptionPlan {
  id: string
  name: string
  description: string
  price: number
  max_stations: number
  features: string[]
  is_active: boolean
  billing_period: BillingPeriod
  period_months: number
  base_plan: string
  is_promo: boolean
  created_at: string
}

export interface Subscription {
  id: string
  user_id: string
  plan_id: string
  billing_period: BillingPeriod
  status: 'active' | 'inactive' | 'cancelled'
  starts_at: string
  expires_at: string
  created_at: string
  plan?: SubscriptionPlan
  profile?: Profile
}

export interface ChargingStation {
  id: string
  subscriber_id: string
  name: string
  description: string
  latitude: number
  longitude: number
  address: string
  city: string
  state: string
  power_kw: number
  connector_types: string[]
  operating_hours: string
  operating_days: string
  price_per_kwh: number
  is_free: boolean
  is_active: boolean
  is_approved: boolean
  images: string[]
  image_url: string | null
  created_at: string
  subscriber?: Profile
  avg_rating?: number
  review_count?: number
}

export interface Review {
  id: string
  user_id: string
  station_id: string
  rating: number
  comment: string
  photo_url: string | null
  created_at: string
  user?: Profile
  station?: ChargingStation
}

export interface Favorite {
  id: string
  user_id: string
  station_id: string
  note: string | null
  created_at: string
  station?: ChargingStation
}

export interface TravelHistoryEntry {
  id: string
  user_id: string
  origin: string
  destination: string
  origin_coords: [number, number]
  dest_coords: [number, number]
  distance_km: number
  duration_minutes: number
  charging_stops: number
  car_name: string
  created_at: string
}
