'use client'

import { useState } from 'react'
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
} from 'lucide-react'
import { formatPrice } from '@/lib/utils'

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
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [settings, setSettings] = useState(sampleSettings)

  const handleSave = async () => {
    setSaving(true)
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground">
            Configure your store settings
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

      <Tabs defaultValue="store" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="store" className="gap-2">
            <Store className="w-4 h-4" />
            Store
          </TabsTrigger>
          <TabsTrigger value="inventory" className="gap-2">
            <Database className="w-4 h-4" />
            Inventory
          </TabsTrigger>
          <TabsTrigger value="fulfillment" className="gap-2">
            <DollarSign className="w-4 h-4" />
            Fulfillment
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="w-4 h-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-2">
            <Shield className="w-4 h-4" />
            Security
          </TabsTrigger>
        </TabsList>

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
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>
                Manage admin account security
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
                <h3 className="font-semibold">Change Password</h3>
                <p className="text-sm text-muted-foreground">
                  Update your admin account password
                </p>
                <Button variant="outline">Change Password</Button>
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
        </TabsContent>
      </Tabs>
    </div>
  )
}
