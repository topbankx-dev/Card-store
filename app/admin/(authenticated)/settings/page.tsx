'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Store,
  Mail,
  Bell,
  Shield,
  Database,
  DollarSign,
  Save,
  CheckCircle2,
  User,
  Award,
  Key,
  Loader2,
} from 'lucide-react'
import { AdminInvites } from '@/components/admin/invites/AdminInvites'
import { formatDate } from '@/lib/utils'

// Sample settings
const sampleSettings = {
  store: {
    name: 'Rapid Strike Gaming Lounge',
    tagline: 'Jamaica\'s Premier TCG Destination',
    email: 'info@tcghub.jm',
    phone: '+1-876-555-0123',
    address: '123 Gaming Street, Kingston, Jamaica',
  },
  inventory: {
    lowStockThreshold: 5,
    autoLowStockAlerts: true,
    defaultCondition: 'NEAR_MINT',
  },
  fulfillment: {
    islandWideDeliveryFee: 500,
    freeDeliveryThreshold: 5000,
    pickupEnabled: true,
    storeAddress: '123 Gaming Street, Kingston 5, Jamaica',
    storeHours: 'Mon-Sat: 10am-8pm, Sun: 12pm-6pm',
  },
  notifications: {
    orderConfirmation: true,
    orderShipped: true,
    lowStockAdmin: true,
    weeklyReport: false,
  },
}

export default function SettingsPage() {
  const { data: session } = useSession()
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [settings, setSettings] = useState(sampleSettings)

  // Password change state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState(false)
  const [changingPassword, setChangingPassword] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const handlePasswordChange = async () => {
    setPasswordError('')
    setPasswordSuccess(false)

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('Passwords do not match')
      return
    }

    if (passwordForm.newPassword.length < 8) {
      setPasswordError('Password must be at least 8 characters')
      return
    }

    setChangingPassword(true)
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        setPasswordError(data.error || 'Failed to change password')
        return
      }

      setPasswordSuccess(true)
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
    } catch {
      setPasswordError('Something went wrong')
    } finally {
      setChangingPassword(false)
    }
  }

  const user = session?.user

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground">
            Configure your store and account settings
          </p>
        </div>
        <div className="flex items-center gap-2">
          {saved && (
            <Badge variant="default" className="bg-green-500 gap-1">
              <CheckCircle2 className="w-3 h-3" />
              Saved
            </Badge>
          )}
          <Button onClick={handleSave} disabled={saving}>
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="profile" className="gap-2">
            <User className="w-4 h-4" />
            <span className="hidden sm:inline">Profile</span>
          </TabsTrigger>
          <TabsTrigger value="store" className="gap-2">
            <Store className="w-4 h-4" />
            <span className="hidden sm:inline">Store</span>
          </TabsTrigger>
          <TabsTrigger value="inventory" className="gap-2">
            <Database className="w-4 h-4" />
            <span className="hidden sm:inline">Inventory</span>
          </TabsTrigger>
          <TabsTrigger value="fulfillment" className="gap-2">
            <DollarSign className="w-4 h-4" />
            <span className="hidden sm:inline">Fulfillment</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="w-4 h-4" />
            <span className="hidden sm:inline">Notifications</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-2">
            <Shield className="w-4 h-4" />
            <span className="hidden sm:inline">Security</span>
          </TabsTrigger>
        </TabsList>

        {/* Profile Settings */}
        <TabsContent value="profile">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Admin Profile Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="w-5 h-5" />
                  Your Profile
                </CardTitle>
                <CardDescription>
                  Your admin account information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
                    <span className="text-2xl font-bold text-white">
                      {user?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'A'}
                    </span>
                  </div>
                  <div>
                    <p className="font-semibold text-lg">{user?.name || 'Admin User'}</p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Shield className="w-4 h-4 text-purple-500" />
                      <span>Administrator</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    <Mail className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <p className="font-medium">{user?.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    <Award className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Role</p>
                      <p className="font-medium">{user?.role}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Change Password Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="w-5 h-5" />
                  Change Password
                </CardTitle>
                <CardDescription>
                  Update your admin account password
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {passwordSuccess && (
                  <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/50 text-green-500 text-sm">
                    Password changed successfully!
                  </div>
                )}

                {passwordError && (
                  <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/50 text-destructive text-sm">
                    {passwordError}
                  </div>
                )}

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">Current Password</Label>
                    <Input
                      id="currentPassword"
                      type="password"
                      value={passwordForm.currentPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                      placeholder="Enter current password"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="newPassword">New Password</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                      placeholder="Enter new password"
                    />
                    <p className="text-xs text-muted-foreground">
                      Must be at least 8 characters
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                      placeholder="Confirm new password"
                    />
                  </div>

                  <Button
                    onClick={handlePasswordChange}
                    disabled={changingPassword || !passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword}
                    className="w-full"
                  >
                    {changingPassword ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Changing...
                      </>
                    ) : (
                      <>
                        <Key className="w-4 h-4 mr-2" />
                        Change Password
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Store Settings */}
        <TabsContent value="store">
          <Card>
            <CardHeader>
              <CardTitle>Store Information</CardTitle>
              <CardDescription>
                Basic information about your store
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="storeName">Store Name</Label>
                  <Input
                    id="storeName"
                    value={settings.store.name}
                    onChange={(e) => setSettings({
                      ...settings,
                      store: { ...settings.store, name: e.target.value }
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tagline">Tagline</Label>
                  <Input
                    id="tagline"
                    value={settings.store.tagline}
                    onChange={(e) => setSettings({
                      ...settings,
                      store: { ...settings.store, tagline: e.target.value }
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Contact Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={settings.store.email}
                    onChange={(e) => setSettings({
                      ...settings,
                      store: { ...settings.store, email: e.target.value }
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={settings.store.phone}
                    onChange={(e) => setSettings({
                      ...settings,
                      store: { ...settings.store, phone: e.target.value }
                    })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  value={settings.store.address}
                  onChange={(e) => setSettings({
                    ...settings,
                    store: { ...settings.store, address: e.target.value }
                  })}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Inventory Settings */}
        <TabsContent value="inventory">
          <Card>
            <CardHeader>
              <CardTitle>Inventory Settings</CardTitle>
              <CardDescription>
                Configure inventory management preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="threshold">Low Stock Threshold</Label>
                  <Input
                    id="threshold"
                    type="number"
                    value={settings.inventory.lowStockThreshold}
                    onChange={(e) => setSettings({
                      ...settings,
                      inventory: { ...settings.inventory, lowStockThreshold: parseInt(e.target.value) || 0 }
                    })}
                  />
                  <p className="text-sm text-muted-foreground">
                    Alert when stock falls below this number
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="defaultCondition">Default Condition</Label>
                  <Input
                    id="defaultCondition"
                    value={settings.inventory.defaultCondition}
                    onChange={(e) => setSettings({
                      ...settings,
                      inventory: { ...settings.inventory, defaultCondition: e.target.value }
                    })}
                  />
                </div>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Low Stock Alerts</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive notifications when products are running low
                  </p>
                </div>
                <Badge variant={settings.inventory.autoLowStockAlerts ? 'default' : 'secondary'}>
                  {settings.inventory.autoLowStockAlerts ? 'Enabled' : 'Disabled'}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Fulfillment Settings */}
        <TabsContent value="fulfillment">
          <Card>
            <CardHeader>
              <CardTitle>Fulfillment Settings</CardTitle>
              <CardDescription>
                Configure delivery and pickup options
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="deliveryFee">Island-Wide Delivery Fee (JMD)</Label>
                  <Input
                    id="deliveryFee"
                    type="number"
                    value={settings.fulfillment.islandWideDeliveryFee}
                    onChange={(e) => setSettings({
                      ...settings,
                      fulfillment: { ...settings.fulfillment, islandWideDeliveryFee: parseInt(e.target.value) || 0 }
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="freeDelivery">Free Delivery Threshold (JMD)</Label>
                  <Input
                    id="freeDelivery"
                    type="number"
                    value={settings.fulfillment.freeDeliveryThreshold}
                    onChange={(e) => setSettings({
                      ...settings,
                      fulfillment: { ...settings.fulfillment, freeDeliveryThreshold: parseInt(e.target.value) || 0 }
                    })}
                  />
                </div>
              </div>
              <Separator />
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>In-Store Pickup</Label>
                    <p className="text-sm text-muted-foreground">
                      Allow customers to pick up orders at your store
                    </p>
                  </div>
                  <Badge variant={settings.fulfillment.pickupEnabled ? 'default' : 'secondary'}>
                    {settings.fulfillment.pickupEnabled ? 'Enabled' : 'Disabled'}
                  </Badge>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="storeAddress">Store Address</Label>
                  <Input
                    id="storeAddress"
                    value={settings.fulfillment.storeAddress}
                    onChange={(e) => setSettings({
                      ...settings,
                      fulfillment: { ...settings.fulfillment, storeAddress: e.target.value }
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="storeHours">Store Hours</Label>
                  <Input
                    id="storeHours"
                    value={settings.fulfillment.storeHours}
                    onChange={(e) => setSettings({
                      ...settings,
                      fulfillment: { ...settings.fulfillment, storeHours: e.target.value }
                    })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Settings */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>
                Choose which notifications to receive
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { key: 'orderConfirmation', label: 'Order Confirmation', description: 'When a new order is placed' },
                { key: 'orderShipped', label: 'Order Shipped', description: 'When an order is shipped' },
                { key: 'lowStockAdmin', label: 'Low Stock Alerts', description: 'When inventory runs low' },
                { key: 'weeklyReport', label: 'Weekly Sales Report', description: 'Summary of weekly performance' },
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>{item.label}</Label>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </div>
                  <Badge variant={settings.notifications[item.key as keyof typeof settings.notifications] ? 'default' : 'secondary'}>
                    {settings.notifications[item.key as keyof typeof settings.notifications] ? 'On' : 'Off'}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security">
          {/* Admin Team Management */}
          <AdminInvites />

          <div className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>
                Additional security options
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="font-semibold">Two-Factor Authentication</h3>
                <p className="text-sm text-muted-foreground">
                  Add an extra layer of security to your admin account
                </p>
                <Button variant="outline">Enable 2FA</Button>
              </div>
              <Separator />
              <div className="space-y-4">
                <h3 className="font-semibold text-destructive">Danger Zone</h3>
                <p className="text-sm text-muted-foreground">
                  Irreversible actions
                </p>
                <div className="flex gap-2">
                  <Button variant="destructive">Export All Data</Button>
                </div>
              </div>
            </CardContent>
          </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
