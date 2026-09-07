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
export type EventStatus = 'DRAFT' | 'UPCOMING' | 'ONGOING' | 'COMPLETED' | 'CANCELLED'

export const EVENT_STATUS_LABELS: Record<EventStatus, string> = {
  DRAFT: 'Draft',
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
    byDay: { date: string; amount: number; orders: number }[]
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
  registration_deadline?: string
  location?: string
  virtual_link?: string
  entry_fee?: number
  max_capacity?: number
  registration_count?: number
  waitlist_enabled?: boolean
  waitlist_max?: number

  // TCG-specific fields
  format?: string
  experience_level?: 'BEGINNER' | 'INTERMEDIATE' | 'COMPETITIVE' | 'ALL'
  subformat?: string
  deck_ownership?: 'BYO' | 'PROVIDED' | 'BOTH'
  max_tables?: number
  prize_pool?: string
  prize_description?: string

  // Media & visibility
  image_url?: string
  visibility?: 'PUBLIC' | 'PRIVATE' | 'UNLISTED'

  // Recurring
  is_recurring?: boolean
  recurring_pattern?: 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY'
  recurring_end_date?: string
  recurring_count?: number

  // Trust & Policies
  refund_policy?: string
  refund_enabled?: boolean
  refund_deadline_hours?: number
  code_of_conduct?: string
  code_of_conduct_enabled?: boolean
  cancellation_policy?: string
  cancellation_consent_required?: boolean
  media_release?: boolean
  attendee_visibility?: 'PUBLIC' | 'PRIVATE' | 'HIDDEN'
  auto_reminder_1_week?: boolean
  auto_reminder_1_day?: boolean
  auto_reminder_1_hour?: boolean

  // Metadata
  status: EventStatus
  created_at: string
  updated_at?: string

  // Relations
  ticket_tiers?: TicketTier[]
}

// Ticket tier type
export interface TicketTier {
  id: string
  event_id: string
  name: string
  price: number
  quantity: number
  sold_count: number
  description?: string
  benefits?: string[]
  created_at?: string
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
