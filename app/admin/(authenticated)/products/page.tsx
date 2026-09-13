'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { ProductTable } from '@/components/admin/products'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Plus,
  Filter,
  X,
  Loader2,
  RefreshCw,
} from 'lucide-react'
import { GAME_LABELS, RARITY_LABELS, type Product } from '@/lib/admin/types'
import { toast } from '@/components/ui/sonner'

export default function ProductsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  // Filters
  const [gameFilter, setGameFilter] = useState<string>(searchParams.get('game') || 'all')
  const [rarityFilter, setRarityFilter] = useState<string>(searchParams.get('rarity') || 'all')
  const [stockFilter, setStockFilter] = useState<string>(searchParams.get('stock') || 'all')

  const fetchProducts = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (gameFilter !== 'all') params.set('game', gameFilter)
      if (rarityFilter !== 'all') params.set('rarity', rarityFilter)
      if (stockFilter !== 'all') params.set('stock', stockFilter)
      params.set('limit', '100')

      const res = await fetch(`/api/admin/products?${params}`)
      if (!res.ok) {
        throw new Error('Failed to fetch products')
      }
      const json = await res.json()
      setProducts(json.data || [])
    } catch (error) {
      console.error('Failed to fetch products:', error)
      toast.error('Failed to load products from database')
    } finally {
      setLoading(false)
    }
  }, [gameFilter, rarityFilter, stockFilter])

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/products/${id}`, {
        method: 'DELETE',
      })
      if (!res.ok) {
        throw new Error('Failed to delete product')
      }
      toast.success('Product deleted successfully')
      setProducts((prev) => prev.filter((p) => p.id !== id))
    } catch (error) {
      console.error('Error deleting product:', error)
      toast.error('Failed to delete product')
    }
  }

  const handleBulkDelete = async (ids: string[]) => {
    try {
      await Promise.all(
        ids.map((id) =>
          fetch(`/api/admin/products/${id}`, {
            method: 'DELETE',
          })
        )
      )
      toast.success(`Deleted ${ids.length} products`)
      setSelectedIds([])
      fetchProducts()
    } catch (error) {
      console.error('Error deleting products:', error)
      toast.error('Failed to delete some products')
    }
  }

  const handleToggleFeatured = async (id: string) => {
    const product = products.find((p) => p.id === id)
    if (!product) return

    const newFeatured = !product.is_featured
    // Optimistic update
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, is_featured: newFeatured } : p))
    )

    try {
      const res = await fetch(`/api/admin/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_featured: newFeatured }),
      })

      if (!res.ok) {
        throw new Error('Failed to update featured status')
      }
      toast.success(newFeatured ? 'Product marked as featured' : 'Product removed from featured')
    } catch (error) {
      console.error('Error toggling featured:', error)
      toast.error('Failed to update featured status')
      // Revert
      setProducts((prev) =>
        prev.map((p) => (p.id === id ? { ...p, is_featured: !newFeatured } : p))
      )
    }
  }

  const clearFilters = () => {
    setGameFilter('all')
    setRarityFilter('all')
    setStockFilter('all')
  }

  const hasFilters = gameFilter !== 'all' || rarityFilter !== 'all' || stockFilter !== 'all'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Products</h1>
          <p className="text-muted-foreground">
            Manage your product inventory ({products.length} products)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => fetchProducts()} disabled={loading}>
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          <Button asChild>
            <Link href="/admin/products/new">
              <Plus className="w-4 h-4 mr-2" />
              Add Product
            </Link>
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Filter className="w-4 h-4" />
              Filters
            </CardTitle>
            {hasFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="w-4 h-4 mr-2" />
                Clear Filters
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <Select value={gameFilter} onValueChange={setGameFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Game" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Games</SelectItem>
                {Object.entries(GAME_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={rarityFilter} onValueChange={setRarityFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Rarity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Rarities</SelectItem>
                {Object.entries(RARITY_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={stockFilter} onValueChange={setStockFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Stock" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Stock</SelectItem>
                <SelectItem value="in">In Stock</SelectItem>
                <SelectItem value="low">Low Stock</SelectItem>
                <SelectItem value="out">Out of Stock</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex items-center gap-2 ml-auto">
              {hasFilters && (
                <div className="flex gap-1">
                  {gameFilter !== 'all' && (
                    <Badge variant="secondary">
                      {GAME_LABELS[gameFilter as keyof typeof GAME_LABELS]}
                      <button
                        className="ml-1 hover:text-destructive"
                        onClick={() => setGameFilter('all')}
                      >
                        ×
                      </button>
                    </Badge>
                  )}
                  {rarityFilter !== 'all' && (
                    <Badge variant="secondary">
                      {RARITY_LABELS[rarityFilter as keyof typeof RARITY_LABELS]}
                      <button
                        className="ml-1 hover:text-destructive"
                        onClick={() => setRarityFilter('all')}
                      >
                        ×
                      </button>
                    </Badge>
                  )}
                  {stockFilter !== 'all' && (
                    <Badge variant="secondary">
                      {stockFilter === 'in' ? 'In Stock' : stockFilter === 'low' ? 'Low Stock' : 'Out of Stock'}
                      <button
                        className="ml-1 hover:text-destructive"
                        onClick={() => setStockFilter('all')}
                      >
                        ×
                      </button>
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Products Table */}
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
        <ProductTable
          products={products}
          onDelete={handleDelete}
          onBulkDelete={handleBulkDelete}
          onToggleFeatured={handleToggleFeatured}
          selectedIds={selectedIds}
          onSelectionChange={setSelectedIds}
        />
      )}
    </div>
  )
}
