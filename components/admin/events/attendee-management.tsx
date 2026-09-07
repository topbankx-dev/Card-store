'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { toast } from '@/components/ui/sonner'
import {
  Users,
  UserCheck,
  UserX,
  Clock,
  Download,
  QrCode,
  Plus,
  Search,
  MoreHorizontal,
  CheckCircle,
  XCircle,
  ArrowUpCircle,
  Trash2,
  Mail,
  Phone,
  Copy,
  Loader2,
  X,
} from 'lucide-react'
import { formatDate } from '@/lib/utils'

interface Registration {
  id: string
  customer_name: string
  customer_email: string
  customer_phone?: string
  status: 'CONFIRMED' | 'CANCELLED' | 'NO_SHOW' | 'CHECKED_IN'
  checked_in_at?: string
  created_at: string
  deck_preference?: string
  experience_level?: string
  notes?: string
  user?: {
    id: string
    name?: string
    email: string
  }
}

interface WaitlistEntry {
  id: string
  customer_name: string
  customer_email: string
  customer_phone?: string
  position: number
  created_at: string
  notes?: string
  user?: {
    id: string
    name?: string
    email: string
  }
}

interface AttendeeStats {
  total: number
  confirmed: number
  checkedIn: number
  cancelled: number
  noShow: number
  waitlistCount: number
}

interface AttendeeManagementProps {
  eventId: string
  eventName: string
  maxCapacity: number
}

export function AttendeeManagement({ eventId, eventName, maxCapacity }: AttendeeManagementProps) {
  const [registrations, setRegistrations] = useState<Registration[]>([])
  const [waitlist, setWaitlist] = useState<WaitlistEntry[]>([])
  const [stats, setStats] = useState<AttendeeStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showQRDialog, setShowQRDialog] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  // Add registration form
  const [newReg, setNewReg] = useState({
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    deck_preference: '',
    notes: '',
  })

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/events/${eventId}/registrations?waitlist=true`)
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      setRegistrations(data.data)
      setWaitlist(data.waitlist)
      setStats(data.stats)
    } catch (error) {
      toast.error('Failed to load attendees')
    } finally {
      setLoading(false)
    }
  }, [eventId])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const filteredRegistrations = registrations.filter(reg =>
    reg.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    reg.customer_email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleCheckIn = async (regId: string) => {
    setActionLoading(regId)
    try {
      const res = await fetch(`/api/admin/events/${eventId}/registrations/${regId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'CHECKED_IN' }),
      })
      if (!res.ok) throw new Error('Failed to check in')
      toast.success('Attendee checked in')
      fetchData()
    } catch {
      toast.error('Failed to check in')
    } finally {
      setActionLoading(null)
    }
  }

  const handleCancel = async (regId: string) => {
    if (!confirm('Cancel this registration?')) return
    setActionLoading(regId)
    try {
      const res = await fetch(`/api/admin/events/${eventId}/registrations/${regId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'CANCELLED' }),
      })
      if (!res.ok) throw new Error('Failed to cancel')
      toast.success('Registration cancelled')
      fetchData()
    } catch {
      toast.error('Failed to cancel')
    } finally {
      setActionLoading(null)
    }
  }

  const handleDelete = async (regId: string) => {
    if (!confirm('Delete this registration permanently?')) return
    setActionLoading(regId)
    try {
      const res = await fetch(`/api/admin/events/${eventId}/registrations/${regId}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('Failed to delete')
      toast.success('Registration deleted')
      fetchData()
    } catch {
      toast.error('Failed to delete')
    } finally {
      setActionLoading(null)
    }
  }

  const handleAddRegistration = async () => {
    if (!newReg.customer_name || !newReg.customer_email) {
      toast.error('Name and email are required')
      return
    }
    setActionLoading('add')
    try {
      const res = await fetch(`/api/admin/events/${eventId}/registrations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newReg),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to add')
      }
      toast.success('Registration added')
      setShowAddDialog(false)
      setNewReg({ customer_name: '', customer_email: '', customer_phone: '', deck_preference: '', notes: '' })
      fetchData()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to add')
    } finally {
      setActionLoading(null)
    }
  }

  const handlePromoteFromWaitlist = async (waitlistId: string) => {
    setActionLoading(waitlistId)
    try {
      // Add to registrations
      const entry = waitlist.find(w => w.id === waitlistId)
      if (!entry) throw new Error('Entry not found')

      const res = await fetch(`/api/admin/events/${eventId}/registrations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name: entry.customer_name,
          customer_email: entry.customer_email,
          customer_phone: entry.customer_phone,
          notes: entry.notes,
        }),
      })
      if (!res.ok) throw new Error('Failed to promote')

      // Remove from waitlist
      await fetch(`/api/admin/events/${eventId}/waitlist/${waitlistId}`, {
        method: 'DELETE',
      })

      toast.success(`${entry.customer_name} promoted from waitlist`)
      fetchData()
    } catch {
      toast.error('Failed to promote')
    } finally {
      setActionLoading(null)
    }
  }

  const handleRemoveFromWaitlist = async (waitlistId: string) => {
    if (!confirm('Remove from waitlist?')) return
    setActionLoading(waitlistId)
    try {
      const res = await fetch(`/api/admin/events/${eventId}/waitlist/${waitlistId}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('Failed to remove')
      toast.success('Removed from waitlist')
      fetchData()
    } catch {
      toast.error('Failed to remove')
    } finally {
      setActionLoading(null)
    }
  }

  const exportToCSV = () => {
    const headers = ['Name', 'Email', 'Phone', 'Status', 'Checked In', 'Deck Preference', 'Notes']
    const rows = registrations.map(reg => [
      reg.customer_name,
      reg.customer_email,
      reg.customer_phone || '',
      reg.status,
      reg.checked_in_at ? formatDate(reg.checked_in_at) : '',
      reg.deck_preference || '',
      reg.notes || '',
    ])

    const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${eventName}-attendees.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Copied to clipboard')
  }

  // Generate QR code data URL
  const generateQRCode = (regId: string) => {
    // Simple QR code simulation - in production, use a library like qrcode.react
    const data = JSON.stringify({ event: eventId, reg: regId, t: Date.now() })
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(data)}`
  }

  const statusColors: Record<string, string> = {
    CONFIRMED: 'bg-green-500/10 text-green-500 border-green-500',
    CHECKED_IN: 'bg-blue-500/10 text-blue-500 border-blue-500',
    CANCELLED: 'bg-red-500/10 text-red-500 border-red-500',
    NO_SHOW: 'bg-yellow-500/10 text-yellow-500 border-yellow-500',
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Users className="w-5 h-5 mx-auto mb-2 text-muted-foreground" />
            <p className="text-2xl font-bold">{stats?.total || 0}</p>
            <p className="text-xs text-muted-foreground">Total Registrations</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <UserCheck className="w-5 h-5 mx-auto mb-2 text-green-500" />
            <p className="text-2xl font-bold">{stats?.confirmed || 0}</p>
            <p className="text-xs text-muted-foreground">Confirmed</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <CheckCircle className="w-5 h-5 mx-auto mb-2 text-blue-500" />
            <p className="text-2xl font-bold">{stats?.checkedIn || 0}</p>
            <p className="text-xs text-muted-foreground">Checked In</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Clock className="w-5 h-5 mx-auto mb-2 text-orange-500" />
            <p className="text-2xl font-bold">{stats?.waitlistCount || 0}</p>
            <p className="text-xs text-muted-foreground">Waitlist</p>
          </CardContent>
        </Card>
      </div>

      {/* Main content */}
      <Tabs defaultValue="registrations">
        <TabsList>
          <TabsTrigger value="registrations">
            Registrations ({registrations.length})
          </TabsTrigger>
          <TabsTrigger value="waitlist">
            Waitlist ({waitlist.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="registrations" className="space-y-4">
          {/* Search and actions */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={exportToCSV}>
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
              <Button onClick={() => setShowAddDialog(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Registration
              </Button>
            </div>
          </div>

          {/* Table */}
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Attendee</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Checked In</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRegistrations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      {searchQuery ? 'No matching registrations' : 'No registrations yet'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRegistrations.map((reg) => (
                    <TableRow key={reg.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{reg.customer_name}</p>
                          {reg.deck_preference && (
                            <p className="text-xs text-muted-foreground">
                              Deck: {reg.deck_preference}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <p className="text-sm flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {reg.customer_email}
                          </p>
                          {reg.customer_phone && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              {reg.customer_phone}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={statusColors[reg.status]}
                        >
                          {reg.status.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {reg.checked_in_at ? formatDate(reg.checked_in_at) : '-'}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {reg.status !== 'CHECKED_IN' && (
                              <DropdownMenuItem
                                onClick={() => handleCheckIn(reg.id)}
                                disabled={actionLoading === reg.id}
                              >
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Check In
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem onClick={() => setShowQRDialog(reg.id)}>
                              <QrCode className="w-4 h-4 mr-2" />
                              Show QR Code
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => copyToClipboard(reg.customer_email)}>
                              <Copy className="w-4 h-4 mr-2" />
                              Copy Email
                            </DropdownMenuItem>
                            {reg.customer_phone && (
                              <DropdownMenuItem onClick={() => copyToClipboard(reg.customer_phone!)}>
                                <Copy className="w-4 h-4 mr-2" />
                                Copy Phone
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            {reg.status !== 'CANCELLED' && (
                              <DropdownMenuItem
                                onClick={() => handleCancel(reg.id)}
                                disabled={actionLoading === reg.id}
                                className="text-yellow-500"
                              >
                                <XCircle className="w-4 h-4 mr-2" />
                                Cancel
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              onClick={() => handleDelete(reg.id)}
                              disabled={actionLoading === reg.id}
                              className="text-destructive"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="waitlist" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Waitlist ({waitlist.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {waitlist.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">No one on waitlist</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>#</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Added</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {waitlist.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell>
                          <Badge variant="outline">{entry.position}</Badge>
                        </TableCell>
                        <TableCell className="font-medium">{entry.customer_name}</TableCell>
                        <TableCell>{entry.customer_email}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {entry.customer_phone || '-'}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {formatDate(entry.created_at)}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handlePromoteFromWaitlist(entry.id)}
                              disabled={actionLoading === entry.id}
                              title="Promote to registration"
                            >
                              <ArrowUpCircle className="w-4 h-4 text-green-500" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemoveFromWaitlist(entry.id)}
                              disabled={actionLoading === entry.id}
                              title="Remove from waitlist"
                            >
                              <X className="w-4 h-4 text-red-500" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Registration Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Registration</DialogTitle>
            <DialogDescription>
              Manually add a new attendee to this event.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={newReg.customer_name}
                onChange={(e) => setNewReg({ ...newReg, customer_name: e.target.value })}
                placeholder="John Doe"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={newReg.customer_email}
                onChange={(e) => setNewReg({ ...newReg, customer_email: e.target.value })}
                placeholder="john@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={newReg.customer_phone}
                onChange={(e) => setNewReg({ ...newReg, customer_phone: e.target.value })}
                placeholder="876-555-1234"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="deck">Deck Preference</Label>
              <Input
                id="deck"
                value={newReg.deck_preference}
                onChange={(e) => setNewReg({ ...newReg, deck_preference: e.target.value })}
                placeholder="Blue Eyes White Dragon"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Input
                id="notes"
                value={newReg.notes}
                onChange={(e) => setNewReg({ ...newReg, notes: e.target.value })}
                placeholder="Any special notes..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddRegistration} disabled={actionLoading === 'add'}>
              {actionLoading === 'add' && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Add Attendee
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* QR Code Dialog */}
      <Dialog open={!!showQRDialog} onOpenChange={() => setShowQRDialog(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Check-in QR Code</DialogTitle>
            <DialogDescription>
              Scan this code at the event to check in.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center py-6">
            {showQRDialog && (
              <>
                <img
                  src={generateQRCode(showQRDialog)}
                  alt="QR Code"
                  className="w-48 h-48 border rounded-lg"
                />
                <p className="text-xs text-muted-foreground mt-4">
                  Registration ID: {showQRDialog.slice(0, 8)}...
                </p>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowQRDialog(null)}>
              Close
            </Button>
            {showQRDialog && (
              <Button
                variant="outline"
                onClick={() => {
                  const url = generateQRCode(showQRDialog)
                  window.open(url, '_blank')
                }}
              >
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
