'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { useAdminToast } from '@/components/admin/ui/use-admin-toast'
import { formatDate } from '@/lib/utils'
import {
  UserPlus,
  Mail,
  Copy,
  Check,
  X,
  MoreHorizontal,
  Loader2,
  Shield,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface AdminInvite {
  id: string
  email: string
  status: 'PENDING' | 'ACCEPTED' | 'EXPIRED' | 'CANCELLED'
  expires_at: string
  created_at: string
  accepted_at: string | null
  invited_by_user: {
    id: string
    name: string
    email: string
  }
}

export function AdminInvites() {
  const { toast } = useAdminToast()
  const [invites, setInvites] = useState<AdminInvite[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  useEffect(() => {
    fetchInvites()
  }, [])

  const fetchInvites = async () => {
    try {
      const res = await fetch('/api/admin/invites')
      const data = await res.json()
      setInvites(data.invites || [])
    } catch (error) {
      console.error('Error fetching invites:', error)
      toast({
        title: 'Error',
        description: 'Failed to load invites',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const sendInvite = async () => {
    if (!email) return

    setIsSubmitting(true)
    try {
      const res = await fetch('/api/admin/invites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const data = await res.json()

      if (!res.ok) {
        toast({
          title: 'Error',
          description: data.error || 'Failed to send invite',
          variant: 'destructive',
        })
        return
      }

      toast({
        title: 'Invite sent!',
        description: data.inviteUrl
          ? 'Share this link with the user'
          : 'The user can now become an admin',
        variant: 'success',
      })

      // If there's an invite URL, copy it to clipboard
      if (data.inviteUrl) {
        await navigator.clipboard.writeText(data.inviteUrl)
        toast({
          title: 'Link copied!',
          description: 'Share this link with the new admin',
          variant: 'success',
        })
      }

      setEmail('')
      setIsDialogOpen(false)
      fetchInvites()
    } catch (error) {
      console.error('Error sending invite:', error)
      toast({
        title: 'Error',
        description: 'Something went wrong',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const cancelInvite = async (inviteId: string) => {
    try {
      const res = await fetch(`/api/admin/invites?id=${inviteId}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        const data = await res.json()
        toast({
          title: 'Error',
          description: data.error || 'Failed to cancel invite',
          variant: 'destructive',
        })
        return
      }

      toast({
        title: 'Invite cancelled',
        description: 'The invite has been cancelled',
        variant: 'success',
      })

      fetchInvites()
    } catch (error) {
      console.error('Error cancelling invite:', error)
      toast({
        title: 'Error',
        description: 'Something went wrong',
        variant: 'destructive',
      })
    }
  }

  const copyInviteLink = async (invite: AdminInvite) => {
    const inviteUrl = `${window.location.origin}/admin/accept-invite?token=${invite.id}`
    await navigator.clipboard.writeText(inviteUrl)
    setCopiedId(invite.id)
    toast({
      title: 'Copied!',
      description: 'Invite link copied to clipboard',
      variant: 'success',
    })
    setTimeout(() => setCopiedId(null), 2000)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Badge variant="default">Pending</Badge>
      case 'ACCEPTED':
        return <Badge variant="secondary" className="bg-green-500/20 text-green-500 border-green-500/50">Accepted</Badge>
      case 'EXPIRED':
        return <Badge variant="secondary">Expired</Badge>
      case 'CANCELLED':
        return <Badge variant="outline">Cancelled</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Admin Team
            </CardTitle>
            <CardDescription>
              Manage admin access for your team members
            </CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="w-4 h-4 mr-2" />
                Invite Admin
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Invite a new admin</DialogTitle>
                <DialogDescription>
                  Enter the email address of the person you want to make an admin.
                  They will receive an email with instructions to complete the process.
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <div className="space-y-2">
                  <label htmlFor="invite-email" className="text-sm font-medium">
                    Email address
                  </label>
                  <div className="flex gap-2">
                    <Input
                      id="invite-email"
                      type="email"
                      placeholder="admin@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          sendInvite()
                        }
                      }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    The invite link will be copied to your clipboard after sending.
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={sendInvite} disabled={!email || isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Mail className="w-4 h-4 mr-2" />
                      Send Invite
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : invites.length === 0 ? (
          <div className="text-center py-8">
            <Mail className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">No admin invites yet</p>
            <p className="text-sm text-muted-foreground">
              Click &quot;Invite Admin&quot; to add team members
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Invited By</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Sent</TableHead>
                <TableHead>Expires</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invites.map((invite) => (
                <TableRow key={invite.id}>
                  <TableCell className="font-medium">{invite.email}</TableCell>
                  <TableCell>{invite.invited_by_user?.name || invite.invited_by_user?.email}</TableCell>
                  <TableCell>{getStatusBadge(invite.status)}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(invite.created_at)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {invite.status === 'PENDING' ? (
                      <span className="text-foreground">
                        {formatDate(invite.expires_at)}
                      </span>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {invite.status === 'PENDING' && (
                          <DropdownMenuItem onClick={() => copyInviteLink(invite)}>
                            {copiedId === invite.id ? (
                              <Check className="w-4 h-4 mr-2" />
                            ) : (
                              <Copy className="w-4 h-4 mr-2" />
                            )}
                            Copy invite link
                          </DropdownMenuItem>
                        )}
                        {invite.status === 'PENDING' && (
                          <DropdownMenuItem
                            onClick={() => cancelInvite(invite.id)}
                            className="text-destructive focus:text-destructive"
                          >
                            <X className="w-4 h-4 mr-2" />
                            Cancel invite
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
