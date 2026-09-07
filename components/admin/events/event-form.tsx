'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { toast } from '@/components/ui/sonner'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  EventFormData,
  EventSchema,
  GameSchema,
  generateSlug,
  getFormatsForGame,
  createDefaultTicketTier,
  type TicketTier,
  type Game,
} from '@/lib/validations/event'
import { TicketTiers } from './ticket-tiers'
import { EventPreview } from './event-preview'
import { RecurringOptions } from './recurring-options'
import { TrustPolicies, DEFAULT_TRUST_POLICY } from './trust-policies'
import { EVENT_STATUS_LABELS, GAME_LABELS } from '@/lib/admin/types'
import {
  Save,
  Send,
  Eye,
  Calendar,
  MapPin,
  Image,
  Settings,
  Ticket,
  Trophy,
  Gamepad2,
  Clock,
  Users,
  Repeat,
  Loader2,
  AlertCircle,
  Info,
  ExternalLink,
  Keyboard,
  Sparkles,
} from 'lucide-react'

// Auto-save storage key
const DRAFT_STORAGE_KEY = 'event-form-draft'

interface EventFormProps {
  initialData?: Partial<EventFormData>
  eventId?: string
  mode: 'create' | 'edit'
}

export function EventForm({ initialData, eventId, mode }: EventFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [showPublishDialog, setShowPublishDialog] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)

  // Form state
  const [formData, setFormData] = useState<EventFormData>(() => {
    // Load from localStorage draft or use initial data
    if (typeof window !== 'undefined' && mode === 'create') {
      const savedDraft = localStorage.getItem(DRAFT_STORAGE_KEY)
      if (savedDraft) {
        try {
          return JSON.parse(savedDraft)
        } catch {
          // Ignore parse errors
        }
      }
    }
    return {
      name: '',
      slug: '',
      game: 'MTG',
      description: '',
      event_date: '',
      end_date: '',
      registration_deadline: '',
      location: 'In-Store',
      virtual_link: '',
      entry_fee: 0,
      max_capacity: 24,
      waitlist_enabled: false,
      waitlist_max: 0,
      format: '',
      experience_level: 'ALL',
      subformat: '',
      deck_ownership: 'BYO',
      max_tables: 6,
      prize_pool: '',
      prize_description: '',
      image_url: '',
      visibility: 'PUBLIC',
      status: 'DRAFT',
      is_recurring: false,
      recurring_pattern: 'WEEKLY',
      recurring_end_date: '',
      recurring_count: 4,
      ticket_tiers: [],
      trust_policy: DEFAULT_TRUST_POLICY,
      ...initialData,
    }
  })

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Auto-save to localStorage
  useEffect(() => {
    if (mode === 'create' && formData.name) {
      const timeout = setTimeout(() => {
        localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(formData))
        setLastSaved(new Date())
      }, 1000) // Debounce 1 second
      return () => clearTimeout(timeout)
    }
  }, [formData, mode])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault()
        if (mode === 'create') {
          setShowPublishDialog(true)
        } else {
          handleSubmit(true)
        }
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault()
        handleSaveDraft()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [formData, mode])

  // Update slug when name changes (if slug is empty or matches old name)
  useEffect(() => {
    if (formData.name && !formData.slug) {
      setFormData(prev => ({
        ...prev,
        slug: generateSlug(prev.name),
      }))
    }
  }, [formData.name])

  // Get formats for selected game
  const availableFormats = useMemo(() => getFormatsForGame(formData.game as Game), [formData.game])

  // Update handlers
  const updateField = useCallback(<K extends keyof EventFormData>(
    field: K,
    value: EventFormData[K]
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when field is updated
    if (errors[field]) {
      setErrors(prev => {
        const next = { ...prev }
        delete next[field]
        return next
      })
    }
  }, [errors])

  const updateTiers = useCallback((tiers: TicketTier[]) => {
    setFormData(prev => ({ ...prev, ticket_tiers: tiers }))
  }, [])

  const updateTrustPolicy = useCallback((trustPolicy: any) => {
    setFormData(prev => ({ ...prev, trust_policy: trustPolicy }))
  }, [])

  // Form validation
  const validate = useCallback((): boolean => {
    const result = EventSchema.safeParse(formData)
    if (!result.success) {
      const fieldErrors: Record<string, string> = {}
      result.error.errors.forEach((err) => {
        const path = err.path.join('.')
        if (!fieldErrors[path]) {
          fieldErrors[path] = err.message
        }
      })
      setErrors(fieldErrors)
      return false
    }
    setErrors({})
    return true
  }, [formData])

  // Save as draft
  const handleSaveDraft = useCallback(async () => {
    const dataToSave = { ...formData, status: 'DRAFT' as const }
    setIsSubmitting(true)

    try {
      const url = mode === 'edit' && eventId
        ? `/api/admin/events/${eventId}`
        : '/api/admin/events'

      const res = await fetch(url, {
        method: mode === 'edit' ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSave),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to save event')
      }

      // Clear draft on successful save
      if (mode === 'create') {
        localStorage.removeItem(DRAFT_STORAGE_KEY)
      }

      toast.success(mode === 'create'
        ? 'Event saved as draft'
        : 'Your changes have been saved')

      if (mode === 'create') {
        const data = await res.json()
        router.push(`/admin/events/${data.data.id}`)
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save event')
    } finally {
      setIsSubmitting(false)
    }
  }, [formData, mode, eventId, router])

  // Publish event
  const handleSubmit = useCallback(async (publishNow = true) => {
    if (!validate()) {
      toast.error('Please fix the errors before saving')
      return
    }

    setShowPublishDialog(false)
    setIsSubmitting(true)

    try {
      const dataToSave = {
        ...formData,
        status: publishNow ? 'UPCOMING' as const : 'DRAFT' as const,
      }

      const url = mode === 'edit' && eventId
        ? `/api/admin/events/${eventId}`
        : '/api/admin/events'

      const res = await fetch(url, {
        method: mode === 'edit' ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSave),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to save event')
      }

      // Clear draft on successful save
      if (mode === 'create') {
        localStorage.removeItem(DRAFT_STORAGE_KEY)
      }

      toast.success(
        publishNow
          ? 'Event published! Your event is now live.'
          : 'Event saved as draft.'
      )

      if (mode === 'create') {
        const data = await res.json()
        router.push(`/admin/events/${data.data.id}`)
      } else {
        router.push('/admin/events')
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save event')
    } finally {
      setIsSubmitting(false)
    }
  }, [formData, mode, eventId, router, validate])

  // Clear draft
  const handleClearDraft = () => {
    if (confirm('Clear the saved draft? This cannot be undone.')) {
      localStorage.removeItem(DRAFT_STORAGE_KEY)
      setFormData({
        name: '',
        slug: '',
        game: 'MTG',
        description: '',
        event_date: '',
        end_date: '',
        registration_deadline: '',
        location: 'In-Store',
        virtual_link: '',
        entry_fee: 0,
        max_capacity: 24,
        waitlist_enabled: false,
        waitlist_max: 0,
        format: '',
        experience_level: 'ALL',
        subformat: '',
        deck_ownership: 'BYO',
        max_tables: 6,
        prize_pool: '',
        prize_description: '',
        image_url: '',
        visibility: 'PUBLIC',
        status: 'DRAFT',
        is_recurring: false,
        recurring_pattern: 'WEEKLY',
        recurring_end_date: '',
        recurring_count: 4,
        ticket_tiers: [],
        trust_policy: DEFAULT_TRUST_POLICY,
      })
    }
  }

  return (
    <TooltipProvider>
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Main form */}
        <div className="flex-1 space-y-6">
          {/* Header actions */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {lastSaved && (
                <span className="text-xs text-muted-foreground">
                  Last saved {lastSaved.toLocaleTimeString()}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Keyboard className="w-3 h-3" />
                    ⌘+S to save
                  </span>
                </TooltipTrigger>
                <TooltipContent>Ctrl/Cmd + S to save draft, Ctrl/Cmd + Enter to publish</TooltipContent>
              </Tooltip>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPreview(!showPreview)}
              >
                <Eye className="w-4 h-4 mr-2" />
                {showPreview ? 'Hide' : 'Show'} Preview
              </Button>
            </div>
          </div>

          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5 md:col-span-2">
                  <Label htmlFor="name">
                    Event Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => updateField('name', e.target.value)}
                    placeholder="Friday Night Magic"
                    className={errors.name ? 'border-destructive' : ''}
                  />
                  {errors.name && (
                    <p className="text-xs text-destructive">{errors.name}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="slug">URL Slug</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="slug"
                      value={formData.slug}
                      onChange={(e) => updateField('slug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
                      placeholder="friday-night-magic"
                      className={errors.slug ? 'border-destructive' : ''}
                    />
                  </div>
                  {errors.slug && (
                    <p className="text-xs text-destructive">{errors.slug}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Preview: /events/{formData.slug || 'your-event'}
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="game">
                    Game <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={formData.game}
                    onValueChange={(value) => {
                      updateField('game', value as Game)
                      updateField('format', '')
                      updateField('subformat', '')
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(GAME_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => updateField('description', e.target.value)}
                    placeholder="Describe your event, what to expect, and who should attend..."
                    rows={4}
                    className={errors.description ? 'border-destructive' : ''}
                  />
                  {errors.description && (
                    <p className="text-xs text-destructive">{errors.description}</p>
                  )}
                  <p className="text-xs text-muted-foreground text-right">
                    {formData.description?.length || 0} / 2000
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Date & Time */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Date & Time
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="event_date">
                    Start Date & Time <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="event_date"
                    type="datetime-local"
                    value={formData.event_date}
                    onChange={(e) => updateField('event_date', e.target.value)}
                    className={errors.event_date ? 'border-destructive' : ''}
                  />
                  {errors.event_date && (
                    <p className="text-xs text-destructive">{errors.event_date}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="end_date">End Date & Time</Label>
                  <Input
                    id="end_date"
                    type="datetime-local"
                    value={formData.end_date || ''}
                    onChange={(e) => updateField('end_date', e.target.value || undefined)}
                    placeholder="Optional"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="registration_deadline">Registration Deadline</Label>
                  <Input
                    id="registration_deadline"
                    type="datetime-local"
                    value={formData.registration_deadline || ''}
                    onChange={(e) => updateField('registration_deadline', e.target.value || undefined)}
                    placeholder="Optional"
                  />
                  <p className="text-xs text-muted-foreground">
                    Registration closes before this time
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="timezone">Timezone</Label>
                  <Input
                    id="timezone"
                    value="America/Jamaica (EST)"
                    disabled
                    className="bg-muted"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Location */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Location
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="location">
                    Venue <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => updateField('location', e.target.value)}
                    placeholder="In-Store or venue name"
                    className={errors.location ? 'border-destructive' : ''}
                  />
                  {errors.location && (
                    <p className="text-xs text-destructive">{errors.location}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="virtual_link">Virtual Meeting Link</Label>
                  <Input
                    id="virtual_link"
                    type="url"
                    value={formData.virtual_link || ''}
                    onChange={(e) => updateField('virtual_link', e.target.value || undefined)}
                    placeholder="https://zoom.us/..."
                  />
                  {formData.virtual_link && (
                    <a
                      href={formData.virtual_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary flex items-center gap-1 hover:underline"
                    >
                      <ExternalLink className="w-3 h-3" />
                      Test link
                    </a>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tickets & Capacity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Ticket className="w-5 h-5" />
                Tickets & Capacity
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="entry_fee">Entry Fee (JMD)</Label>
                  <Input
                    id="entry_fee"
                    type="number"
                    min="0"
                    step="100"
                    value={formData.entry_fee}
                    onChange={(e) => updateField('entry_fee', parseInt(e.target.value) || 0)}
                    className={errors.entry_fee ? 'border-destructive' : ''}
                  />
                  {formData.entry_fee === 0 && (
                    <p className="text-xs text-green-600">Free event</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="max_capacity">
                    Max Capacity <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="max_capacity"
                    type="number"
                    min="1"
                    max="1000"
                    value={formData.max_capacity}
                    onChange={(e) => updateField('max_capacity', parseInt(e.target.value) || 1)}
                    className={errors.max_capacity ? 'border-destructive' : ''}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="waitlist_max">Waitlist Max</Label>
                  <Input
                    id="waitlist_max"
                    type="number"
                    min="0"
                    value={formData.waitlist_max ?? 0}
                    onChange={(e) => updateField('waitlist_max', parseInt(e.target.value) || 0)}
                    disabled={!formData.waitlist_enabled}
                  />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Switch
                  id="waitlist_enabled"
                  checked={formData.waitlist_enabled}
                  onCheckedChange={(checked) => updateField('waitlist_enabled', checked)}
                />
                <Label htmlFor="waitlist_enabled" className="cursor-pointer">
                  Enable waitlist when event is full
                </Label>
              </div>
            </CardContent>
          </Card>

          {/* TCG Format */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gamepad2 className="w-5 h-5" />
                TCG Format
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="format">Format</Label>
                  <Select
                    value={formData.format}
                    onValueChange={(value) => updateField('format', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select format" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableFormats.map((fmt) => (
                        <SelectItem key={fmt.value} value={fmt.value}>
                          {fmt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="experience_level">Experience Level</Label>
                  <Select
                    value={formData.experience_level}
                    onValueChange={(value) => updateField('experience_level', value as any)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="BEGINNER">Beginner Friendly</SelectItem>
                      <SelectItem value="INTERMEDIATE">Intermediate</SelectItem>
                      <SelectItem value="COMPETITIVE">Competitive</SelectItem>
                      <SelectItem value="ALL">All Skill Levels</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="subformat">
                    Subformat {formData.game === 'MTG' ? '(e.g., Modern, Legacy)' : ''}
                  </Label>
                  <Input
                    id="subformat"
                    value={formData.subformat}
                    onChange={(e) => updateField('subformat', e.target.value)}
                    placeholder={formData.game === 'MTG' ? 'Modern, Legacy, Pauper...' : 'Optional subformat'}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="deck_ownership">Deck Requirements</Label>
                  <Select
                    value={formData.deck_ownership}
                    onValueChange={(value) => updateField('deck_ownership', value as any)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="BYO">Bring Your Own</SelectItem>
                      <SelectItem value="PROVIDED">Deck Provided</SelectItem>
                      <SelectItem value="BOTH">BYO or Deck Provided</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="max_tables">Max Tables</Label>
                  <Input
                    id="max_tables"
                    type="number"
                    min="1"
                    value={formData.max_tables ?? 1}
                    onChange={(e) => updateField('max_tables', parseInt(e.target.value) || 1)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Physical table availability
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Prizes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="w-5 h-5" />
                Prizes & Rewards
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="prize_pool">Prize Pool Summary</Label>
                  <Input
                    id="prize_pool"
                    value={formData.prize_pool}
                    onChange={(e) => updateField('prize_pool', e.target.value)}
                    placeholder="Store credit, promo packs, playmats..."
                  />
                  <p className="text-xs text-muted-foreground">
                    Brief prize description shown on event card
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="prize_description">Full Prize Structure</Label>
                  <Input
                    id="prize_description"
                    value={formData.prize_description}
                    onChange={(e) => updateField('prize_description', e.target.value)}
                    placeholder="1st: $50 store credit, 2nd: $25..."
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Ticket Tiers */}
          <TicketTiers
            tiers={formData.ticket_tiers || []}
            onChange={updateTiers}
            maxCapacity={formData.max_capacity || 20}
          />

          {/* Recurring Events */}
          <RecurringOptions
            startDate={formData.event_date}
            isRecurring={formData.is_recurring}
            pattern={formData.recurring_pattern}
            endDate={formData.recurring_end_date}
            count={formData.recurring_count}
            onChange={(updates) => setFormData(prev => ({ ...prev, ...updates }))}
          />

          {/* Trust & Policies */}
          <TrustPolicies
            data={formData.trust_policy || DEFAULT_TRUST_POLICY}
            onChange={(data) => updateTrustPolicy(data)}
          />

          {/* Media & Visibility */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Image className="w-5 h-5" />
                Media & Visibility
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="image_url">Event Image URL</Label>
                  <Input
                    id="image_url"
                    type="url"
                    value={formData.image_url || ''}
                    onChange={(e) => updateField('image_url', e.target.value || undefined)}
                    placeholder="https://..."
                  />
                  {formData.image_url && (
                    <div className="mt-2 rounded-lg overflow-hidden border">
                      <img
                        src={formData.image_url}
                        alt="Event preview"
                        className="w-full h-32 object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none'
                        }}
                      />
                    </div>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="visibility">Visibility</Label>
                  <Select
                    value={formData.visibility}
                    onValueChange={(value) => updateField('visibility', value as any)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PUBLIC">
                        <div className="flex items-center gap-2">
                          <Eye className="w-4 h-4" />
                          <span>Public</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="UNLISTED">
                        <div className="flex items-center gap-2">
                          <Eye className="w-4 h-4" />
                          <span>Unlisted</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="PRIVATE">
                        <div className="flex items-center gap-2">
                          <Eye className="w-4 h-4" />
                          <span>Private</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="flex items-start gap-2 mt-2">
                    <Info className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-muted-foreground">
                      {formData.visibility === 'PUBLIC' && 'Visible to everyone on the events page'}
                      {formData.visibility === 'UNLISTED' && 'Only accessible via direct link'}
                      {formData.visibility === 'PRIVATE' && 'Only visible to admins'}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Submit actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t">
            {mode === 'create' && (
              <Button
                type="button"
                variant="outline"
                onClick={handleClearDraft}
              >
                Clear Draft
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleSaveDraft}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Draft
                </>
              )}
            </Button>
            <Button
              type="button"
              onClick={() => setShowPublishDialog(true)}
              disabled={isSubmitting || !formData.name || !formData.event_date}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Publishing...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  {mode === 'create' ? 'Publish Event' : 'Update & Publish'}
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Preview panel */}
        {showPreview && (
          <div className="w-full lg:w-80 lg:sticky lg:top-4 lg:self-start">
            <EventPreview event={formData} />
          </div>
        )}

        {/* Publish dialog */}
        <Dialog open={showPublishDialog} onOpenChange={setShowPublishDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Publish Event?</DialogTitle>
              <DialogDescription>
                Your event will go live and start accepting registrations.
                {formData.is_recurring && (
                  <span className="block mt-2">
                    This will also create {formData.recurring_count} recurring events.
                  </span>
                )}
              </DialogDescription>
            </DialogHeader>
            <div className="flex items-start gap-2 p-3 rounded-lg bg-muted">
              <AlertCircle className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
              <p className="text-sm text-muted-foreground">
                You can always edit or cancel the event after publishing.
              </p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowPublishDialog(false)}>
                Keep Editing
              </Button>
              <Button onClick={() => handleSubmit(true)} disabled={isSubmitting}>
                <Send className="w-4 h-4 mr-2" />
                Publish Now
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  )
}
