'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { formatDate, cn } from '@/lib/utils'
import {
  Shield,
  MoreHorizontal,
  Eye,
  UserCog,
  Ban,
  CheckCircle2,
  Search,
  Mail,
  User,
} from 'lucide-react'
import { type User as UserType, type Role } from '@/lib/admin/types'

// Sample users
const sampleUsers: UserType[] = [
  {
    id: 'user_123',
    email: 'john@example.com',
    name: 'John Smith',
    role: 'PLAYER',
    created_at: '2024-01-15T10:00:00Z',
    order_count: 12,
  },
  {
    id: 'user_456',
    email: 'jane@example.com',
    name: 'Jane Doe',
    role: 'PLAYER',
    created_at: '2024-01-14T10:00:00Z',
    order_count: 8,
  },
  {
    id: 'user_789',
    email: 'admin@tcghub.jm',
    name: 'Admin User',
    role: 'ADMIN',
    created_at: '2024-01-01T10:00:00Z',
    order_count: 0,
  },
  {
    id: 'user_012',
    email: 'mike@example.com',
    name: 'Mike Brown',
    role: 'PLAYER',
    created_at: '2024-01-13T10:00:00Z',
    order_count: 5,
  },
  {
    id: 'user_345',
    email: 'sarah@example.com',
    name: 'Sarah Wilson',
    role: 'PLAYER',
    created_at: '2024-01-12T10:00:00Z',
    order_count: 3,
  },
]

export default function UsersPage() {
  const [users, setUsers] = useState<UserType[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null)
  const [showRoleDialog, setShowRoleDialog] = useState(false)
  const [showSuspendDialog, setShowSuspendDialog] = useState(false)
  const [newRole, setNewRole] = useState<Role>('PLAYER')

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        // In production, fetch from /api/admin/users
        await new Promise(resolve => setTimeout(resolve, 500))
        setUsers(sampleUsers)
      } catch (error) {
        console.error('Failed to fetch users:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchUsers()
  }, [])

  const filteredUsers = users.filter((user) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      if (
        !user.name?.toLowerCase().includes(query) &&
        !user.email.toLowerCase().includes(query)
      ) {
        return false
      }
    }
    if (roleFilter !== 'all' && user.role !== roleFilter) return false
    return true
  })

  const handleRoleChange = () => {
    if (selectedUser && newRole !== selectedUser.role) {
      setUsers(users.map((u) =>
        u.id === selectedUser.id ? { ...u, role: newRole } : u
      ))
      // In production, call API
    }
    setShowRoleDialog(false)
    setSelectedUser(null)
  }

  const handleSuspend = () => {
    // In production, call API
    setShowSuspendDialog(false)
    setSelectedUser(null)
  }

  const getUserInitials = (user: UserType) => {
    return user.name
      ?.split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || user.email[0].toUpperCase()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Customers</h1>
        <p className="text-muted-foreground">
          Manage your customers and their accounts
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search customers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="PLAYER">Players</SelectItem>
                <SelectItem value="ADMIN">Admins</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
      </Card>

      {/* Users Table */}
      {loading ? (
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-muted rounded animate-pulse" />
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="border rounded-lg bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="text-center">Orders</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    No customers found
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {getUserInitials(user)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{user.name || 'No name'}</p>
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {user.email}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.role === 'ADMIN' ? 'default' : 'secondary'}>
                        {user.role === 'ADMIN' && <Shield className="w-3 h-3 mr-1" />}
                        {user.role === 'ADMIN' ? 'Admin' : 'Player'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="font-mono">{user.order_count || 0}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {formatDate(user.created_at)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/admin/users/${user.id}`}>
                              <Eye className="w-4 h-4 mr-2" />
                              View Profile
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedUser(user)
                              setNewRole(user.role === 'ADMIN' ? 'PLAYER' : 'ADMIN')
                              setShowRoleDialog(true)
                            }}
                          >
                            <UserCog className="w-4 h-4 mr-2" />
                            {user.role === 'ADMIN' ? 'Remove Admin' : 'Make Admin'}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => {
                              setSelectedUser(user)
                              setShowSuspendDialog(true)
                            }}
                          >
                            <Ban className="w-4 h-4 mr-2" />
                            Suspend Account
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Role Change Dialog */}
      <Dialog open={showRoleDialog} onOpenChange={setShowRoleDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change User Role</DialogTitle>
            <DialogDescription>
              {newRole === 'ADMIN'
                ? `Are you sure you want to make ${selectedUser?.name || selectedUser?.email} an admin? They will have full access to the admin panel.`
                : `Are you sure you want to remove admin access from ${selectedUser?.name || selectedUser?.email}?`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRoleDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleRoleChange}>
              {newRole === 'ADMIN' ? 'Make Admin' : 'Remove Admin'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Suspend Dialog */}
      <Dialog open={showSuspendDialog} onOpenChange={setShowSuspendDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Suspend Account</DialogTitle>
            <DialogDescription>
              Are you sure you want to suspend {selectedUser?.name || selectedUser?.email}&apos;s account?
              They will not be able to log in until the suspension is lifted.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSuspendDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleSuspend}>
              Suspend Account
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
