import { z } from 'zod'

// Game types
export const GameSchema = z.enum(['MTG', 'YGO', 'POKEMON', 'ONE_PIECE', 'NARUTO', 'DIGIMON', 'ACCESSORIES'] as const)
export type Game = z.infer<typeof GameSchema>

// Event status
export const EventStatusSchema = z.enum(['DRAFT', 'UPCOMING', 'ONGOING', 'COMPLETED', 'CANCELLED'] as const)
export type EventStatus = z.infer<typeof EventStatusSchema>

// Event visibility
export const EventVisibilitySchema = z.enum(['PUBLIC', 'PRIVATE', 'UNLISTED'] as const)
export type EventVisibility = z.infer<typeof EventVisibilitySchema>

// Experience level
export const ExperienceLevelSchema = z.enum(['BEGINNER', 'INTERMEDIATE', 'COMPETITIVE', 'ALL'] as const)
export type ExperienceLevel = z.infer<typeof ExperienceLevelSchema>

// Deck ownership
export const DeckOwnershipSchema = z.enum(['BYO', 'PROVIDED', 'BOTH'] as const)
export type DeckOwnership = z.infer<typeof DeckOwnershipSchema>

// Game-specific formats
export const MTG_FORMATS = [
  // Constructed
  { value: 'STANDARD', label: 'Standard' },
  { value: 'MODERN', label: 'Modern' },
  { value: 'LEGACY', label: 'Legacy' },
  { value: 'VINTAGE', label: 'Vintage' },
  { value: 'PAUPER', label: 'Pauper' },
  { value: 'PIONEER', label: 'Pioneer' },
  { value: 'HISTORIC', label: 'Historic' },
  { value: 'EXPLORER', label: 'Explorer' },
  // Limited
  { value: 'DRAFT', label: 'Draft' },
  { value: 'SEALED', label: 'Sealed' },
  { value: 'CUBE_DRAFT', label: 'Cube Draft' },
  { value: 'CUBE_SEALED', label: 'Cube Sealed' },
  // Commander
  { value: 'COMMANDER', label: 'Commander' },
  { value: 'COMMANDER_CASUAL', label: 'Commander (Casual)' },
  { value: 'COMMANDER Competitive', label: 'Commander (Competitive)' },
  { value: 'PDH', label: 'Pauper Commander (PDH)' },
  { value: 'DUEL_COMMANDER', label: 'Duel Commander' },
  { value: 'BRANCHING', label: 'Branching Commander' },
] as const

export const YGO_FORMATS = [
  { value: 'ADVANCED', label: 'Advanced Format' },
  { value: 'SPEED_DUEL', label: 'Speed Duel' },
  { value: 'GOAT', label: 'GOAT Format' },
  { value: 'TRADITIONAL', label: 'Traditional' },
  { value: 'RUSH_DUEL', label: 'Rush Duel' },
  { value: 'MASTER_DUEL', label: 'Master Duel' },
] as const

export const POKEMON_FORMATS = [
  { value: 'STANDARD', label: 'Standard' },
  { value: 'EXPANDED', label: 'Expanded' },
  { value: 'LIMITED', label: 'Limited (Draft/Sealed)' },
  { value: 'BLITZ', label: 'Blitz' },
  { value: 'UPENDO', label: 'Upendo' },
] as const

export const OTHER_FORMATS: Record<string, { value: string; label: string }[]> = {
  ONE_PIECE: [
    { value: 'STANDARD', label: 'Standard' },
    { value: 'EXHIBIT', label: 'Exhibit' },
  ],
  NARUTO: [
    { value: 'STANDARD', label: 'Standard' },
    { value: 'WARS', label: 'Wars' },
  ],
  DIGIMON: [
    { value: 'STANDARD', label: 'Standard' },
    { value: 'BT', label: 'BT Series' },
    { value: 'EX', label: 'EX Series' },
  ],
}

// Ticket tier schema
export const TicketTierSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Tier name is required').max(50),
  price: z.number().min(0, 'Price must be 0 or greater'),
  quantity: z.number().int().min(1, 'At least 1 ticket required'),
  sold_count: z.number().int().min(0).default(0),
  description: z.string().max(200).optional(),
  benefits: z.array(z.string()).optional(),
})

export type TicketTier = z.infer<typeof TicketTierSchema>

// Trust & Policy schema
export const TrustPolicySchema = z.object({
  refund_policy: z.string().default(''),
  refund_enabled: z.boolean().default(false),
  refund_deadline_hours: z.number().int().min(0).default(48),
  code_of_conduct: z.string().default(''),
  code_of_conduct_enabled: z.boolean().default(false),
  cancellation_policy: z.string().default(''),
  cancellation_consent_required: z.boolean().default(false),
  media_release: z.boolean().default(false),
  attendee_visibility: z.enum(['PUBLIC', 'PRIVATE', 'HIDDEN']).default('PUBLIC'),
  auto_reminder_1_week: z.boolean().default(true),
  auto_reminder_1_day: z.boolean().default(true),
  auto_reminder_1_hour: z.boolean().default(false),
})

export type TrustPolicyData = z.infer<typeof TrustPolicySchema>

// Main event schema
export const EventSchema = z.object({
  // Basic info
  name: z.string().min(3, 'Event name must be at least 3 characters').max(100, 'Event name must be under 100 characters'),
  slug: z.string().regex(/^[a-z0-9-]+$/, 'Slug must be lowercase with hyphens only').optional(),
  game: GameSchema,
  description: z.string().max(2000, 'Description must be under 2000 characters').optional(),

  // Date & time
  event_date: z.string().min(1, 'Start date is required'),
  end_date: z.string().optional().nullable(),
  registration_deadline: z.string().optional().nullable(),

  // Location
  location: z.string().min(1, 'Location is required').max(200),
  virtual_link: z.string().url('Must be a valid URL').optional().nullable().or(z.literal('')),

  // Tickets & capacity
  entry_fee: z.number().min(0, 'Entry fee must be 0 or greater').default(0),
  max_capacity: z.number().int().min(1, 'At least 1 spot required').max(1000),
  waitlist_enabled: z.boolean().default(false),
  waitlist_max: z.number().int().min(1).optional().nullable(),

  // TCG-specific
  format: z.string().optional(),
  experience_level: ExperienceLevelSchema.optional(),
  subformat: z.string().optional(),
  deck_ownership: DeckOwnershipSchema.optional(),
  max_tables: z.number().int().min(1).optional().nullable(),
  prize_pool: z.string().max(500).optional(),
  prize_description: z.string().max(1000).optional(),

  // Media & visibility
  image_url: z.string().url('Must be a valid image URL').optional().nullable().or(z.literal('')),
  visibility: EventVisibilitySchema.default('PUBLIC'),

  // Status
  status: EventStatusSchema.default('DRAFT'),

  // Recurring
  is_recurring: z.boolean().default(false),
  recurring_pattern: z.enum(['WEEKLY', 'BIWEEKLY', 'MONTHLY']).optional(),
  recurring_end_date: z.string().optional().nullable(),
  recurring_count: z.number().int().min(1).max(52).optional(),

  // Ticket tiers
  ticket_tiers: z.array(TicketTierSchema).optional().default([]),

  // Trust & Policies
  trust_policy: TrustPolicySchema.optional(),
})

export type EventFormData = z.infer<typeof EventSchema>

// Recurring event generation
export function generateRecurringDates(
  startDate: string,
  pattern: 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY',
  endDate?: string | null,
  count?: number
): string[] {
  const dates: string[] = []
  const start = new Date(startDate)
  const end = endDate ? new Date(endDate) : null
  const maxCount = count || 52

  let current = new Date(start)
  let iterations = 0

  while (iterations < maxCount) {
    if (end && current > end) break
    dates.push(current.toISOString())

    switch (pattern) {
      case 'WEEKLY':
        current.setDate(current.getDate() + 7)
        break
      case 'BIWEEKLY':
        current.setDate(current.getDate() + 14)
        break
      case 'MONTHLY':
        current.setMonth(current.getMonth() + 1)
        break
    }
    iterations++
  }

  return dates
}

// Slug generation
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '')
}

// Default ticket tier
export function createDefaultTicketTier(): TicketTier {
  return {
    id: crypto.randomUUID(),
    name: 'General Admission',
    price: 0,
    quantity: 20,
    sold_count: 0,
    description: '',
    benefits: [],
  }
}

// Experience level labels
export const EXPERIENCE_LABELS: Record<ExperienceLevel, string> = {
  BEGINNER: 'Beginner Friendly',
  INTERMEDIATE: 'Intermediate',
  COMPETITIVE: 'Competitive',
  ALL: 'All Skill Levels',
}

// Deck ownership labels
export const DECK_OWNERSHIP_LABELS: Record<DeckOwnership, string> = {
  BYO: 'Bring Your Own',
  PROVIDED: 'Deck Provided',
  BOTH: 'BYO or Deck Provided',
}

// Validation helpers
export function validateSlug(slug: string): boolean {
  return /^[a-z0-9-]+$/.test(slug)
}

export function getFormatsForGame(game: Game): { value: string; label: string }[] {
  switch (game) {
    case 'MTG':
      return [...MTG_FORMATS]
    case 'YGO':
      return [...YGO_FORMATS]
    case 'POKEMON':
      return [...POKEMON_FORMATS]
    default:
      return OTHER_FORMATS[game] || [{ value: 'STANDARD', label: 'Standard' }]
  }
}

// Calendar link generation
export function generateCalendarLinks(
  event: { name: string; event_date: string; end_date?: string | null; location?: string | null; description?: string | null }
) {
  const start = new Date(event.event_date)
  const end = event.end_date ? new Date(event.end_date) : new Date(start.getTime() + 3 * 60 * 60 * 1000)

  const formatDate = (d: Date) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'

  const google = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(event.name)}&dates=${formatDate(start)}/${formatDate(end)}&location=${encodeURIComponent(event.location || '')}&details=${encodeURIComponent(event.description || '')}`

  return { google }
}

// Post-event survey link generator
export function generateSurveyLink(eventSlug: string, eventId: string): string {
  return `/events/${eventSlug}/survey?event=${eventId}`
}
