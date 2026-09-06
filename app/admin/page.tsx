'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { CartSidebar } from '@/components/cart-sidebar'
import { formatPrice, cn, formatDate } from '@/lib/utils'
import { Loader2 } from 'lucide-react'
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Clock,
  XCircle,
  Plus,
  Search,
  Shield,
} from 'lucide-react'

// Sample data - in production, this comes from the database
const sampleStats = {
  totalRevenue: 245000,
  totalOrders: 47,
  totalProducts: 234,
  totalCustomers: 89,
  pendingOrders: 5,
  lowStockProducts: 8,
}

const sampleOrders = [
  {
    id: 'ord_1',
    customer_name: 'John Smith',
    customer_email: 'john@example.com',
    total_amount: 12500,
    status: 'PENDING',
    fulfillment_type: 'IN_STORE_PICKUP',
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    items: 3,
  },
  {
    id: 'ord_2',
    customer_name: 'Jane Doe',
    customer_email: 'jane@example.com',
    total_amount: 8500,
    status: 'PAID',
    fulfillment_type: 'ISLAND_WIDE_DELIVERY',
    created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    items: 2,
  },
  {
    id: 'ord_3',
    customer_name: 'Mike Brown',
    customer_email: 'mike@example.com',
    total_amount: 45000,
    status: 'READY_FOR_PICKUP',
    fulfillment_type: 'IN_STORE_PICKUP',
    created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    items: 5,
  },
  {
    id: 'ord_4',
    customer_name: 'Sarah Wilson',
    customer_email: 'sarah@example.com',
    total_amount: 3200,
    status: 'SHIPPED',
    fulfillment_type: 'ISLAND_WIDE_DELIVERY',
    created_at: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
    items: 1,
  },
]

const sampleProducts = [
  { id: '1', name: 'Blue-Eyes White Dragon', game: 'YGO', stock: 3, price: 4500 },
  { id: '2', name: 'Charizard VMAX Rainbow', game: 'POKEMON', stock: 1, price: 12500 },
  { id: '3', name: 'Pikachu V Union', game: 'POKEMON', stock: 0, price: 2800 },
  { id: '4', name: 'Time Walk', game: 'MTG', stock: 1, price: 45000 },
  { id: '5', name: 'Luffy Gear 5', game: 'ONE_PIECE', stock: 5, price: 3200 },
]

const sampleEvents = [
  { id: '1', name: 'Friday Night Magic', date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), registered: 12, capacity: 24 },
  { id: '2', name: 'Yu-Gi-Oh! OTS Tournament', date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), registered: 28, capacity: 32 },
  { id: '3', name: 'Pokemon VGC Cup', date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), registered: 8, capacity: 20 },
]

const statusConfig: Record<string, { icon: any, color: string, label: string }> = {
  PENDING: { icon: Clock, color: 'bg-yellow-500/10 text-yellow-500', label: 'Pending' },
  PAID: { icon: CheckCircle2, color: 'bg-blue-500/10 text-blue-500', label: 'Paid' },
  PROCESSING: { icon: Package, color: 'bg-purple-500/10 text-purple-500', label: 'Processing' },
  READY_FOR_PICKUP: { icon: CheckCircle2, color: 'bg-green-500/10 text-green-500', label: 'Ready' },
  SHIPPED: { icon: TrendingUp, color: 'bg-indigo-500/10 text-indigo-500', label: 'Shipped' },
  DELIVERED: { icon: CheckCircle2, color: 'bg-green-500/10 text-green-500', label: 'Delivered' },
  CANCELLED: { icon: XCircle, color: 'bg-red-500/10 text-red-500', label: 'Cancelled' },
  REFUNDED: { icon: XCircle, color: 'bg-gray-500/10 text-gray-500', label: 'Refunded' },
}

type Tab = 'overview' | 'orders' | 'products' | 'events' | 'add-product'

export default function AdminPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [activeTab, setActiveTab] = useState<Tab>('overview')
  const [searchQuery, setSearchQuery] = useState('')

  // Check if user is admin
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/admin/login')
    } else if (status === 'authenticated' && session?.user?.role !== 'ADMIN') {
      router.push('/login?error=AccessDenied')
    }
  }, [status, session, router])

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Verifying access...</p>
        </div>
      </div>
    )
  }

  if (status === 'authenticated' && session?.user?.role !== 'ADMIN') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <Shield className="w-12 h-12 mx-auto mb-4 text-red-500" />
            <h2 className="text-xl font-bold mb-2">Access Denied</h2>
            <p className="text-muted-foreground mb-4">
              You don&apos;t have permission to access the admin panel.
            </p>
            <Button onClick={() => router.push('/')}>
              Go to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Add product form state
  const [newProduct, setNewProduct] = useState({
    name: '',
    game: 'YGO',
    set: '',
    rarity: 'COMMON',
    condition: 'NEAR_MINT',
    price: '',
    stock_quantity: '',
    description: '',
    is_featured: false,
    is_sealed: false,
  })

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...newProduct,
          price: parseFloat(newProduct.price),
          stock_quantity: parseInt(newProduct.stock_quantity),
        }),
      })

      if (response.ok) {
        // Reset form
        setNewProduct({
          name: '',
          game: 'YGO',
          set: '',
          rarity: 'COMMON',
          condition: 'NEAR_MINT',
          price: '',
          stock_quantity: '',
          description: '',
          is_featured: false,
          is_sealed: false,
        })
        alert('Product added successfully!')
        setActiveTab('products')
      } else {
        alert('Failed to add product')
      }
    } catch (error) {
      console.error('Error adding product:', error)
      alert('Failed to add product')
    }
  }

  const tabs = [
    { key: 'overview', label: 'Overview', icon: LayoutDashboard },
    { key: 'orders', label: 'Orders', icon: ShoppingCart },
    { key: 'products', label: 'Products', icon: Package },
    { key: 'events', label: 'Events', icon: TrendingUp },
    { key: 'add-product', label: 'Add Product', icon: Plus },
  ]

  return (
    <>
      <Header />
      <CartSidebar />

      <main className="min-h-screen py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Sidebar */}
            <aside className="lg:w-64 flex-shrink-0">
              <div className="sticky top-24">
                <div className="mb-6">
                  <h1 className="text-2xl font-bold">Admin Dashboard</h1>
                  <p className="text-sm text-muted-foreground">
                    Manage your store
                  </p>
                </div>

                <nav className="space-y-1">
                  {tabs.map((tab) => {
                    const Icon = tab.icon
                    return (
                      <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key as Tab)}
                        className={cn(
                          "w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                          activeTab === tab.key
                            ? "bg-primary text-primary-foreground"
                            : "hover:bg-accent"
                        )}
                      >
                        <Icon className="w-4 h-4" />
                        {tab.label}
                      </button>
                    )
                  })}
                </nav>
              </div>
            </aside>

            {/* Main content */}
            <div className="flex-1 space-y-6">
              {activeTab === 'overview' && (
                <>
                  {/* Stats grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <StatCard
                      title="Total Revenue"
                      value={formatPrice(sampleStats.totalRevenue)}
                      icon={TrendingUp}
                      color="text-green-500"
                      trend="+12.5%"
                    />
                    <StatCard
                      title="Total Orders"
                      value={sampleStats.totalOrders.toString()}
                      icon={ShoppingCart}
                      color="text-blue-500"
                      trend="+8"
                    />
                    <StatCard
                      title="Total Customers"
                      value={sampleStats.totalCustomers.toString()}
                      icon={Users}
                      color="text-purple-500"
                      trend="+12"
                    />
                    <StatCard
                      title="Total Products"
                      value={sampleStats.totalProducts.toString()}
                      icon={Package}
                      color="text-yellow-500"
                    />
                    <StatCard
                      title="Pending Orders"
                      value={sampleStats.pendingOrders.toString()}
                      icon={Clock}
                      color="text-orange-500"
                      alert={sampleStats.pendingOrders > 0}
                    />
                    <StatCard
                      title="Low Stock"
                      value={sampleStats.lowStockProducts.toString()}
                      icon={AlertCircle}
                      color="text-red-500"
                      alert={sampleStats.lowStockProducts > 0}
                    />
                  </div>

                  {/* Recent orders */}
                  <Card>
                    <CardHeader>
                      <div className="flex justify-between items-center">
                        <CardTitle>Recent Orders</CardTitle>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setActiveTab('orders')}
                        >
                          View All
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <OrdersTable orders={sampleOrders.slice(0, 3)} />
                    </CardContent>
                  </Card>
                </>
              )}

              {activeTab === 'orders' && (
                <Card>
                  <CardHeader>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <CardTitle>All Orders</CardTitle>
                      <div className="relative w-full sm:w-80">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          placeholder="Search orders..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-9"
                        />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <OrdersTable orders={sampleOrders} />
                  </CardContent>
                </Card>
              )}

              {activeTab === 'products' && (
                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <CardTitle>Products Inventory</CardTitle>
                      <Button onClick={() => setActiveTab('add-product')}>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Product
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {sampleProducts.map((product) => (
                        <div
                          key={product.id}
                          className="flex items-center justify-between p-3 rounded-md border hover:bg-accent transition-colors"
                        >
                          <div className="flex-1">
                            <p className="font-medium">{product.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {product.game}
                            </p>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="text-sm font-medium">
                              {formatPrice(product.price)}
                            </span>
                            <Badge
                              variant={product.stock === 0 ? 'destructive' : product.stock < 3 ? 'secondary' : 'outline'}
                              className="min-w-[60px] justify-center"
                            >
                              {product.stock === 0 ? 'Out of Stock' : `Stock: ${product.stock}`}
                            </Badge>
                            <Button variant="ghost" size="sm">
                              Edit
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {activeTab === 'events' && (
                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <CardTitle>Upcoming Events</CardTitle>
                      <Button>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Event
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {sampleEvents.map((event) => (
                        <div
                          key={event.id}
                          className="p-4 rounded-md border hover:bg-accent transition-colors"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div>
                              <h3 className="font-semibold">{event.name}</h3>
                              <p className="text-sm text-muted-foreground">
                                {formatDate(event.date)}
                              </p>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="text-right">
                                <p className="text-sm font-medium">
                                  {event.registered} / {event.capacity}
                                </p>
                                <p className="text-xs text-muted-foreground">registered</p>
                              </div>
                              <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-primary"
                                  style={{
                                    width: `${(event.registered / event.capacity) * 100}%`,
                                  }}
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {activeTab === 'add-product' && (
                <Card>
                  <CardHeader>
                    <CardTitle>Add New Product</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleAddProduct} className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium mb-2 block">
                            Product Name *
                          </label>
                          <Input
                            required
                            value={newProduct.name}
                            onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                            placeholder="e.g. Blue-Eyes White Dragon"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium mb-2 block">
                            Game *
                          </label>
                          <select
                            required
                            value={newProduct.game}
                            onChange={(e) => setNewProduct({ ...newProduct, game: e.target.value })}
                            className="w-full h-10 px-3 rounded-md border border-input bg-background"
                          >
                            <option value="YGO">Yu-Gi-Oh!</option>
                            <option value="POKEMON">Pokémon</option>
                            <option value="MTG">Magic: The Gathering</option>
                            <option value="ONE_PIECE">One Piece</option>
                            <option value="DIGIMON">Digimon</option>
                            <option value="ACCESSORIES">Accessories</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-sm font-medium mb-2 block">
                            Set
                          </label>
                          <Input
                            value={newProduct.set}
                            onChange={(e) => setNewProduct({ ...newProduct, set: e.target.value })}
                            placeholder="e.g. Legend of Blue Eyes"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium mb-2 block">
                            Rarity
                          </label>
                          <select
                            value={newProduct.rarity}
                            onChange={(e) => setNewProduct({ ...newProduct, rarity: e.target.value })}
                            className="w-full h-10 px-3 rounded-md border border-input bg-background"
                          >
                            <option value="COMMON">Common</option>
                            <option value="UNCOMMON">Uncommon</option>
                            <option value="RARE">Rare</option>
                            <option value="SUPER_RARE">Super Rare</option>
                            <option value="ULTRA_RARE">Ultra Rare</option>
                            <option value="SECRET_RARE">Secret Rare</option>
                            <option value="MYTHIC">Mythic</option>
                            <option value="PROMO">Promo</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-sm font-medium mb-2 block">
                            Condition
                          </label>
                          <select
                            value={newProduct.condition}
                            onChange={(e) => setNewProduct({ ...newProduct, condition: e.target.value })}
                            className="w-full h-10 px-3 rounded-md border border-input bg-background"
                          >
                            <option value="MINT">Mint</option>
                            <option value="NEAR_MINT">Near Mint</option>
                            <option value="EXCELLENT">Excellent</option>
                            <option value="GOOD">Good</option>
                            <option value="PLAYED">Played</option>
                            <option value="SEALED">Sealed</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-sm font-medium mb-2 block">
                            Price (JMD) *
                          </label>
                          <Input
                            type="number"
                            step="0.01"
                            required
                            value={newProduct.price}
                            onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                            placeholder="0.00"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium mb-2 block">
                            Stock Quantity *
                          </label>
                          <Input
                            type="number"
                            required
                            value={newProduct.stock_quantity}
                            onChange={(e) => setNewProduct({ ...newProduct, stock_quantity: e.target.value })}
                            placeholder="0"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-sm font-medium mb-2 block">
                          Description
                        </label>
                        <textarea
                          value={newProduct.description}
                          onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                          className="w-full min-h-[100px] px-3 py-2 rounded-md border border-input bg-background"
                          placeholder="Product description..."
                        />
                      </div>

                      <div className="flex flex-col sm:flex-row gap-4">
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={newProduct.is_featured}
                            onChange={(e) => setNewProduct({ ...newProduct, is_featured: e.target.checked })}
                            className="rounded border-input bg-background text-primary"
                          />
                          <span className="text-sm">Featured product</span>
                        </label>
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={newProduct.is_sealed}
                            onChange={(e) => setNewProduct({ ...newProduct, is_sealed: e.target.checked })}
                            className="rounded border-input bg-background text-primary"
                          />
                          <span className="text-sm">Sealed product</span>
                        </label>
                      </div>

                      <div className="flex gap-4 pt-4">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setActiveTab('products')}
                        >
                          Cancel
                        </Button>
                        <Button type="submit">
                          Add Product
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </>
  )
}

// Helper component for stats
function StatCard({
  title,
  value,
  icon: Icon,
  color,
  trend,
  alert,
}: {
  title: string
  value: string
  icon: any
  color: string
  trend?: string
  alert?: boolean
}) {
  return (
    <Card className={cn(alert && "border-orange-500/50")}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground mb-1">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            {trend && (
              <p className="text-xs text-green-500 mt-1">{trend}</p>
            )}
          </div>
          <div className={cn("w-10 h-10 rounded-md bg-accent flex items-center justify-center", color)}>
            <Icon className="w-5 h-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Helper component for orders table
function OrdersTable({ orders }: { orders: typeof sampleOrders }) {
  return (
    <div className="space-y-2">
      {orders.map((order) => {
        const StatusIcon = statusConfig[order.status].icon
        return (
          <div
            key={order.id}
            className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-md border hover:bg-accent transition-colors gap-2"
          >
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div>
                <p className="font-medium text-sm">{order.customer_name}</p>
                <p className="text-xs text-muted-foreground">
                  {order.customer_email}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-xs text-muted-foreground">
                {formatDate(order.created_at)}
              </span>
              <Badge
                variant="secondary"
                className={statusConfig[order.status].color}
              >
                <StatusIcon className="w-3 h-3 mr-1" />
                {statusConfig[order.status].label}
              </Badge>
              <span className="text-sm font-bold text-primary">
                {formatPrice(order.total_amount)}
              </span>
              <span className="text-xs text-muted-foreground">
                {order.items} items
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}