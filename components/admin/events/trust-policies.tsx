'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Shield,
  AlertTriangle,
  RefreshCw,
  Clock,
  CheckCircle,
  Info,
  X,
  Plus,
} from 'lucide-react'

interface TrustPolicyData {
  refund_policy: string
  refund_enabled: boolean
  refund_deadline_hours: number
  code_of_conduct: string
  code_of_conduct_enabled: boolean
  cancellation_policy: string
  cancellation_consent_required: boolean
  media_release: boolean
  attendee_visibility: 'PUBLIC' | 'PRIVATE' | 'HIDDEN'
  auto_reminder_1_week: boolean
  auto_reminder_1_day: boolean
  auto_reminder_1_hour: boolean
}

interface TrustPoliciesProps {
  data: TrustPolicyData
  onChange: (data: TrustPolicyData) => void
}

const DEFAULT_REFUND_POLICY = `Refund Policy:
- Full refunds available up to 48 hours before the event
- 50% refund for cancellations within 24-48 hours
- No refunds within 24 hours of the event
- Transfers to another attendee are allowed up to 2 hours before the event

Exceptions:
- Events cancelled by the organizer will receive full refunds
- Weather or emergency cancellations will be handled case-by-case`

const DEFAULT_CODE_OF_CONDUCT = `Code of Conduct Agreement:
By registering for this event, you agree to:

1. Treat all participants with respect and courtesy
2. Follow all event rules and judge's decisions
3. Maintain fair play and good sportsmanship
4. Keep personal belongings secure
5. Report any issues to event staff immediately
6. Follow the venue's policies and guidelines

Failure to comply may result in removal from the event without refund.`

const DEFAULT_CANCELLATION_POLICY = `Cancellation Policy:
- By registering, you commit to attending the event
- If you cannot attend, please cancel your registration as soon as possible
- This allows others on the waitlist to attend
- No-shows may affect eligibility for future events
- Cancellations within 24 hours of the event may be flagged

Your registration constitutes agreement to these terms.`

export function TrustPolicies({ data, onChange }: TrustPoliciesProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const update = (field: keyof TrustPolicyData, value: unknown) => {
    onChange({ ...data, [field]: value })
  }

  const enabledCount = [
    data.refund_enabled,
    data.code_of_conduct_enabled,
    data.cancellation_consent_required,
    data.auto_reminder_1_week,
    data.auto_reminder_1_day,
    data.auto_reminder_1_hour,
  ].filter(Boolean).length

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            <CardTitle className="text-lg">Trust & Policies</CardTitle>
            {enabledCount > 0 && (
              <Badge variant="secondary">{enabledCount} active</Badge>
            )}
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? 'Less' : 'More'}
          </Button>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Configure attendee trust features, policies, and automated reminders
        </p>
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-6">
          {/* Refund Policy */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-muted-foreground" />
                <Label>Refund Policy</Label>
              </div>
              <Switch
                checked={data.refund_enabled}
                onCheckedChange={(checked) => update('refund_enabled', checked)}
              />
            </div>
            {data.refund_enabled && (
              <div className="pl-6 space-y-3">
                <Textarea
                  value={data.refund_policy}
                  onChange={(e) => update('refund_policy', e.target.value)}
                  rows={6}
                  placeholder="Enter your refund policy..."
                />
                <div className="flex items-center gap-2">
                  <Label htmlFor="refund_deadline">Refund cutoff (hours before event)</Label>
                  <Input
                    id="refund_deadline"
                    type="number"
                    min="0"
                    max="168"
                    value={data.refund_deadline_hours}
                    onChange={(e) => update('refund_deadline_hours', parseInt(e.target.value) || 48)}
                    className="w-24"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="border-t" />

          {/* Code of Conduct */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-muted-foreground" />
                <Label>Code of Conduct Agreement</Label>
              </div>
              <Switch
                checked={data.code_of_conduct_enabled}
                onCheckedChange={(checked) => update('code_of_conduct_enabled', checked)}
              />
            </div>
            {data.code_of_conduct_enabled && (
              <div className="pl-6">
                <Textarea
                  value={data.code_of_conduct}
                  onChange={(e) => update('code_of_conduct', e.target.value)}
                  rows={6}
                  placeholder="Enter your code of conduct..."
                />
              </div>
            )}
          </div>

          <div className="border-t" />

          {/* Cancellation Policy */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <X className="w-4 h-4 text-muted-foreground" />
                <Label>Cancellation Policy Consent</Label>
              </div>
              <Switch
                checked={data.cancellation_consent_required}
                onCheckedChange={(checked) => update('cancellation_consent_required', checked)}
              />
            </div>
            {data.cancellation_consent_required && (
              <div className="pl-6">
                <Textarea
                  value={data.cancellation_policy}
                  onChange={(e) => update('cancellation_policy', e.target.value)}
                  rows={4}
                  placeholder="Enter your cancellation policy..."
                />
              </div>
            )}
          </div>

          <div className="border-t" />

          {/* Media Release */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-muted-foreground" />
              <Label>Media/Photo Release</Label>
            </div>
            <Switch
              checked={data.media_release}
              onCheckedChange={(checked) => update('media_release', checked)}
            />
          </div>

          <div className="border-t" />

          {/* Attendee Visibility */}
          <div className="space-y-3">
            <Label>Attendee List Visibility</Label>
            <div className="flex gap-2">
              {(['PUBLIC', 'PRIVATE', 'HIDDEN'] as const).map((visibility) => (
                <Button
                  key={visibility}
                  type="button"
                  variant={data.attendee_visibility === visibility ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => update('attendee_visibility', visibility)}
                >
                  {visibility === 'PUBLIC' && 'Public'}
                  {visibility === 'PRIVATE' && 'Admins Only'}
                  {visibility === 'HIDDEN' && 'Hidden'}
                </Button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              {data.attendee_visibility === 'PUBLIC' && 'Attendees can see who else is registered'}
              {data.attendee_visibility === 'PRIVATE' && 'Only admins can see the attendee list'}
              {data.attendee_visibility === 'HIDDEN' && 'No one can see who is registered (anonymous)'}
            </p>
          </div>

          <div className="border-t" />

          {/* Automated Reminders */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <Label>Automated Email Reminders</Label>
            </div>
            <p className="text-xs text-muted-foreground">
              Send automatic reminders to registered attendees
            </p>

            <div className="space-y-2 pl-6">
              <div className="flex items-center justify-between">
                <Label htmlFor="reminder_1_week" className="text-sm">1 week before</Label>
                <Switch
                  id="reminder_1_week"
                  checked={data.auto_reminder_1_week}
                  onCheckedChange={(checked) => update('auto_reminder_1_week', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="reminder_1_day" className="text-sm">1 day before</Label>
                <Switch
                  id="reminder_1_day"
                  checked={data.auto_reminder_1_day}
                  onCheckedChange={(checked) => update('auto_reminder_1_day', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="reminder_1_hour" className="text-sm">1 hour before</Label>
                <Switch
                  id="reminder_1_hour"
                  checked={data.auto_reminder_1_hour}
                  onCheckedChange={(checked) => update('auto_reminder_1_hour', checked)}
                />
              </div>
            </div>
          </div>

          {/* Info note */}
          <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-500/10 text-blue-600 text-sm">
            <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <p>
              Trust features help build attendee confidence and set clear expectations.
              Automated reminders improve attendance rates significantly.
            </p>
          </div>
        </CardContent>
      )}
    </Card>
  )
}

// Default trust policy data
export const DEFAULT_TRUST_POLICY: TrustPolicyData = {
  refund_policy: DEFAULT_REFUND_POLICY,
  refund_enabled: false,
  refund_deadline_hours: 48,
  code_of_conduct: DEFAULT_CODE_OF_CONDUCT,
  code_of_conduct_enabled: false,
  cancellation_policy: DEFAULT_CANCELLATION_POLICY,
  cancellation_consent_required: false,
  media_release: false,
  attendee_visibility: 'PUBLIC',
  auto_reminder_1_week: true,
  auto_reminder_1_day: true,
  auto_reminder_1_hour: false,
}
