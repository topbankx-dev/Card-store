// Admin-specific TypeScript types

export type Role = 'PLAYER' | 'ADMIN'

// Order status types
export type OrderStatus =
  | 'PENDING'
  | 'PAID'
  | 'PROCESSING'
  | 'READY_FOR_PICKUP'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'REFUNDED'

export const ORDER_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ['PAID', 'CANCELLED'],
  PAID: ['PROCESSING', 'REFUNDED'],
  PROCESSING: ['READY_FOR_PICKUP', 'SHIPPED', 'REFUNDED'],
  READY_FOR_PICKUP: ['DELIVERED', 'REFUNDED'],
  SHIPPED: ['DELIVERED', 'REFUNDED'],
  DELIVERED: ['REFUNDED'],
  CANCELLED: [],
  REFUNDED: [],
}

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: 'Pending',
  PAID: 'Paid',
  PROCESSING: 'Processing',
  READY_FOR_PICKUP: 'Ready for Pickup',
  SHIPPED: 'Shipped',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
  REFUNDED: 'Refunded',
}

// Event status types
export type EventStatus = 'UPCOMING' | 'ONGOING' | 'COMPLETED' | 'CANCELLED'

export const EVENT_STATUS_LABELS: Record<EventStatus, string> = {
  UPCOMING: 'Upcoming',
  ONGOING: 'Ongoing',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
}

// Game types
export type Game =
  | 'YGO'
  | 'POKEMON'
  | 'MTG'
  | 'ONE_PIECE'
  | 'NARUTO'
  | 'DIGIMON'
  | 'ACCESSORIES'

export const GAME_LABELS: Record<Game, string> = {
  YGO: 'Yu-Gi-Oh!',
  POKEMON: 'Pokémon',
  MTG: 'Magic: The Gathering',
  ONE_PIECE: 'One Piece',
  NARUTO: 'Naruto',
  DIGIMON: 'Digimon',
  ACCESSORIES: 'Accessories',
}

// Rarity types
export type Rarity =
  | 'COMMON'
  | 'UNCOMMON'
  | 'RARE'
  | 'SUPER_RARE'
  | 'ULTRA_RARE'
  | 'SECRET_RARE'
  | 'MYTHIC'
  | 'PROMO'

export const RARITY_LABELS: Record<Rarity, string> = {
  COMMON: 'Common',
  UNCOMMON: 'Uncommon',
  RARE: 'Rare',
  SUPER_RARE: 'Super Rare',
  ULTRA_RARE: 'Ultra Rare',
  SECRET_RARE: 'Secret Rare',
  MYTHIC: 'Mythic',
  PROMO: 'Promo',
}

// Condition types
export type Condition =
  | 'MINT'
  | 'NEAR_MINT'
  | 'EXCELLENT'
  | 'GOOD'
  | 'PLAYED'
  | 'SEALED'

export const CONDITION_LABELS: Record<Condition, string> = {
  MINT: 'Mint',
  NEAR_MINT: 'Near Mint',
  EXCELLENT: 'Excellent',
  GOOD: 'Good',
  PLAYED: 'Played',
  SEALED: 'Sealed',
}

// Fulfillment types
export type FulfillmentType = 'IN_STORE_PICKUP' | 'ISLAND_WIDE_DELIVERY'

export const FULFILLMENT_LABELS: Record<FulfillmentType, string> = {
  IN_STORE_PICKUP: 'In-Store Pickup',
  ISLAND_WIDE_DELIVERY: 'Island-Wide Delivery',
}

// Promo code types
export type DiscountType = 'PERCENTAGE' | 'FIXED'

// Analytics types
export interface AnalyticsData {
  revenue: {
    total: number
    change: number
    byDay: { date: string; amount: number }[]
  }
  orders: {
    total: number
    pending: number
    completed: number
    cancelled: number
    byStatus: { status: string; count: number }[]
  }
  products: {
    total: number
    lowStock: number
    outOfStock: number
    topSelling: { product: Product; quantity: number }[]
  }
  customers: {
    total: number
    newThisPeriod: number
    returningRate: number
  }
}

// Product type (matches Supabase schema)
export interface Product {
  id: string
  name: string
  slug: string
  game: Game
  set?: string
  rarity: Rarity
  condition: Condition
  price: number
  stock_quantity: number
  image_url?: string
  description?: string
  is_featured: boolean
  is_sealed: boolean
  created_at: string
  updated_at?: string
}

// Order type (matches Supabase schema)
export interface Order {
  id: string
  userId?: string
  total_amount: number
  status: OrderStatus
  fulfillment_type: FulfillmentType
  shipping_address?: string
  customer_name: string
  customer_email: string
  customer_phone?: string
  notes?: string
  tracking_number?: string
  shipped_at?: string
  promo_code_id?: string
  discount_amount?: number
  created_at: string
  user?: {
    id: string
    name?: string
    email: string
  }
  items?: OrderItem[]
}

export interface OrderItem {
  id: string
  orderId: string
  productId: string
  quantity: number
  price_at_purchase: number
  product?: {
    id: string
    name: string
    slug: string
    image_url?: string
    price: number
  }
}

// User type (matches Supabase schema)
export interface User {
  id: string
  email: string
  name?: string
  role: Role
  created_at: string
  order_count?: number
}

// Event type (matches Supabase schema)
export interface Event {
  id: string
  name: string
  slug: string
  game: Game
  description?: string
  event_date: string
  end_date?: string
  entry_fee?: number
  max_capacity?: number
  location?: string
  status: EventStatus
  image_url?: string
  created_at: string
  registration_count?: number
}

// PromoCode type
export interface PromoCode {
  id: string
  code: string
  discount_type: DiscountType
  discount_value: number
  max_uses?: number
  used_count: number
  min_order_amount?: number
  expires_at?: string
  is_active: boolean
  created_by?: string
  created_at: string
}

// AuditLog type
export interface AuditLog {
  id: string
  user_id: string
  action: string
  entity_type: string
  entity_id?: string
  details: Record<string, unknown>
  ip_address?: string
  created_at: string
  user?: {
    id: string
    name?: string
    email: string
  }
}

// Pagination types
export interface PaginationInfo {
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: PaginationInfo
}
