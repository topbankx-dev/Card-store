'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { ProductTable } from '@/components/admin/products'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
} from 'lucide-react'
import { GAME_LABELS, RARITY_LABELS, type Product } from '@/lib/admin/types'
import { cn } from '@/lib/utils'

// Sample data - in production, this comes from API
const sampleProducts: Product[] = [
  {
    id: '1',
    name: 'Blue-Eyes White Dragon',
    slug: 'blue-eyes-white-dragon',
    game: 'YGO',
    set: 'Legend of Blue Eyes',
    rarity: 'RARE',
    condition: 'NEAR_MINT',
    price: 4500,
    stock_quantity: 3,
    image_url: 'https://images.ygoprodeck.com/images/cards/89631139.jpg',
    description: 'The ultimate dragon. This card is a must-have for any Blue-Eyes deck.',
    is_featured: true,
    is_sealed: false,
    created_at: '2024-01-15T10:00:00Z',
  },
  {
    id: '2',
    name: 'Charizard VMAX Rainbow',
    slug: 'charizard-vmax-rainbow',
    game: 'POKEMON',
    set: 'Darkness Ablaze',
    rarity: 'SECRET_RARE',
    condition: 'MINT',
    price: 12500,
    stock_quantity: 1,
    image_url: 'https://images.pokemontcg.io/swsh3/20_hires.png',
    is_featured: true,
    is_sealed: false,
    created_at: '2024-01-14T10:00:00Z',
  },
  {
    id: '3',
    name: 'Time Walk',
    slug: 'time-walk',
    game: 'MTG',
    set: '30th Anniversary',
    rarity: 'MYTHIC',
    condition: 'PLAYED',
    price: 45000,
    stock_quantity: 1,
    description: 'Take an extra turn after this one.',
    is_featured: false,
    is_sealed: false,
    created_at: '2024-01-13T10:00:00Z',
  },
  {
    id: '4',
    name: 'Pikachu V Union',
    slug: 'pikachu-v-union',
    game: 'POKEMON',
    set: 'Evolving Skies',
    rarity: 'ULTRA_RARE',
    condition: 'NEAR_MINT',
    price: 2800,
    stock_quantity: 0,
    is_featured: false,
    is_sealed: false,
    created_at: '2024-01-12T10:00:00Z',
  },
  {
    id: '5',
    name: 'Luffy Gear 5',
    slug: 'luffy-gear-5',
    game: 'ONE_PIECE',
    set: 'One Piece Carddass',
    rarity: 'SUPER_RARE',
    condition: 'MINT',
    price: 3200,
    stock_quantity: 5,
    is_featured: false,
    is_sealed: false,
    created_at: '2024-01-11T10:00:00Z',
  },
  {
    id: '6',
    name: 'Dark Magician',
    slug: 'dark-magician',
    game: 'YGO',
    set: 'Maze of Memories',
    rarity: 'RARE',
    condition: 'EXCELLENT',
    price: 1200,
    stock_quantity: 8,
    is_featured: false,
    is_sealed: false,
    created_at: '2024-01-10T10:00:00Z',
  },
]

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

  useEffect(() => {
    // Simulate API fetch
    const fetchProducts = async () => {
      try {
        // In production, fetch from /api/admin/products with filters
        await new Promise(resolve => setTimeout(resolve, 500))
        setProducts(sampleProducts)
      } catch (error) {
        console.error('Failed to fetch products:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchProducts()
  }, [])

  // Apply filters
  const filteredProducts = products.filter((product) => {
    if (gameFilter !== 'all' && product.game !== gameFilter) return false
    if (rarityFilter !== 'all' && product.rarity !== rarityFilter) return false
    if (stockFilter === 'low' && product.stock_quantity >= 5) return false
    if (stockFilter === 'out' && product.stock_quantity > 0) return false
    if (stockFilter === 'in' && product.stock_quantity === 0) return false
    return true
  })

  const handleDelete = (id: string) => {
    setProducts(products.filter((p) => p.id !== id))
    // In production, call DELETE /api/admin/products/[id]
  }

  const handleBulkDelete = (ids: string[]) => {
    setProducts(products.filter((p) => !ids.includes(p.id)))
    setSelectedIds([])
    // In production, call DELETE /api/admin/products with ids param
  }

  const handleToggleFeatured = (id: string) => {
    setProducts(products.map((p) =>
      p.id === id ? { ...p, is_featured: !p.is_featured } : p
    ))
    // In production, call PUT /api/admin/products/[id]
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
            Manage your product inventory ({filteredProducts.length} products)
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/products/new">
            <Plus className="w-4 h-4 mr-2" />
            Add Product
          </Link>
        </Button>
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
          products={filteredProducts}
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
