'use client'

import { useState, useEffect, Suspense, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { useCart } from '@/components/ui/use-toast'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { CartSidebar } from '@/components/cart-sidebar'
import { Filter, Search, ShoppingCart, Heart, X, Loader2, ImageIcon, Sparkles } from 'lucide-react'
import { formatPrice, cn } from '@/lib/utils'
import { GAME_LABELS, RARITY_LABELS, CONDITION_LABELS, type Product } from '@/lib/admin/types'
import Link from 'next/link'

const games = ['YGO', 'POKEMON', 'MTG', 'ONE_PIECE', 'NARUTO', 'DIGIMON', 'ACCESSORIES']
const rarities = ['COMMON', 'UNCOMMON', 'RARE', 'SUPER_RARE', 'ULTRA_RARE', 'SECRET_RARE', 'MYTHIC', 'PROMO']
const conditions = ['MINT', 'NEAR_MINT', 'EXCELLENT', 'GOOD', 'PLAYED']

const rarityColors: Record<string, string> = {
  COMMON: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
  UNCOMMON: 'bg-green-500/10 text-green-500 border-green-500/20',
  RARE: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  SUPER_RARE: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
  ULTRA_RARE: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  SECRET_RARE: 'bg-pink-500/10 text-pink-500 border-pink-500/20',
  MYTHIC: 'bg-red-500/10 text-red-500 border-red-500/20',
  PROMO: 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20',
}

function ShopContent() {
  const searchParams = useSearchParams()
  const { addItem } = useCart()

  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedGames, setSelectedGames] = useState<string[]>(
    searchParams.get('game') ? [searchParams.get('game')!] : []
  )
  const [selectedRarities, setSelectedRarities] = useState<string[]>([])
  const [selectedConditions, setSelectedConditions] = useState<string[]>([])
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 150000])

  useEffect(() => {
    async function loadProducts() {
      setLoading(true)
      try {
        const res = await fetch('/api/products?limit=100')
        if (res.ok) {
          const json = await res.json()
          if (json.products && Array.isArray(json.products)) {
            setProducts(json.products)
          }
        }
      } catch (err) {
        console.error('Failed to fetch products:', err)
      } finally {
        setLoading(false)
      }
    }
    loadProducts()
  }, [])

  const toggleFilter = (type: string, value: string) => {
    switch (type) {
      case 'game':
        setSelectedGames(prev =>
          prev.includes(value) ? prev.filter(g => g !== value) : [...prev, value]
        )
        break
      case 'rarity':
        setSelectedRarities(prev =>
          prev.includes(value) ? prev.filter(r => r !== value) : [...prev, value]
        )
        break
      case 'condition':
        setSelectedConditions(prev =>
          prev.includes(value) ? prev.filter(c => c !== value) : [...prev, value]
        )
        break
    }
  }

  const clearFilters = () => {
    setSelectedGames([])
    setSelectedRarities([])
    setSelectedConditions([])
    setPriceRange([0, 150000])
    setSearchQuery('')
  }

  // Filter products
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      // Search query
      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        const matchesName = product.name?.toLowerCase().includes(q)
        const matchesSet = product.set?.toLowerCase().includes(q)
        const matchesDesc = product.description?.toLowerCase().includes(q)
        if (!matchesName && !matchesSet && !matchesDesc) return false
      }
      // Game filter
      if (selectedGames.length > 0 && !selectedGames.includes(product.game)) {
        return false
      }
      // Rarity filter
      if (selectedRarities.length > 0 && !selectedRarities.includes(product.rarity)) {
        return false
      }
      // Condition filter
      if (selectedConditions.length > 0 && !selectedConditions.includes(product.condition)) {
        return false
      }
      // Price filter
      if (product.price < priceRange[0] || product.price > priceRange[1]) {
        return false
      }
      return true
    })
  }, [products, searchQuery, selectedGames, selectedRarities, selectedConditions, priceRange])

  const activeFilterCount = selectedGames.length + selectedRarities.length + selectedConditions.length

  return (
    <>
      <Header />
      <CartSidebar />

      <main className="min-h-screen py-8">
        <div className="container mx-auto px-4">
          {/* Page header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold">Shop Cards & Singles</h1>
              <p className="text-muted-foreground">
                {loading ? 'Loading inventory...' : `${filteredProducts.length} items in stock`}
              </p>
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto">
              <div className="relative flex-1 md:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search cards, sets, or effects..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Button
                variant="outline"
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className="relative"
              >
                <Filter className="w-4 h-4 mr-2" />
                Filters
                {activeFilterCount > 0 && (
                  <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
                    {activeFilterCount}
                  </span>
                )}
              </Button>
            </div>
          </div>

          <div className="flex gap-8">
            {/* Sidebar filters - Desktop */}
            <aside className="hidden lg:block w-64 flex-shrink-0">
              <div className="sticky top-24 space-y-6">
                <FilterSection
                  title="Game"
                  options={games}
                  selected={selectedGames}
                  onToggle={(v) => toggleFilter('game', v)}
                  labels={GAME_LABELS}
                />

                <FilterSection
                  title="Rarity"
                  options={rarities}
                  selected={selectedRarities}
                  onToggle={(v) => toggleFilter('rarity', v)}
                  labels={RARITY_LABELS}
                />

                <FilterSection
                  title="Condition"
                  options={conditions}
                  selected={selectedConditions}
                  onToggle={(v) => toggleFilter('condition', v)}
                  labels={CONDITION_LABELS}
                />

                <PriceFilter
                  range={priceRange}
                  onChange={setPriceRange}
                />

                {activeFilterCount > 0 && (
                  <Button variant="ghost" onClick={clearFilters} className="w-full">
                    <X className="w-4 h-4 mr-2" />
                    Clear Filters
                  </Button>
                )}
              </div>
            </aside>

            {/* Mobile filters */}
            {isFilterOpen && (
              <div className="lg:hidden fixed inset-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="container mx-auto px-4 py-8">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold">Filters</h2>
                    <Button variant="ghost" size="icon" onClick={() => setIsFilterOpen(false)}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
                    <FilterSection
                      title="Game"
                      options={games}
                      selected={selectedGames}
                      onToggle={(v) => toggleFilter('game', v)}
                      labels={GAME_LABELS}
                    />

                    <FilterSection
                      title="Rarity"
                      options={rarities}
                      selected={selectedRarities}
                      onToggle={(v) => toggleFilter('rarity', v)}
                      labels={RARITY_LABELS}
                    />

                    <FilterSection
                      title="Condition"
                      options={conditions}
                      selected={selectedConditions}
                      onToggle={(v) => toggleFilter('condition', v)}
                      labels={CONDITION_LABELS}
                    />

                    <PriceFilter
                      range={priceRange}
                      onChange={setPriceRange}
                    />
                  </div>

                  <div className="flex gap-4 mt-8">
                    <Button variant="outline" onClick={clearFilters} className="flex-1">
                      Clear All
                    </Button>
                    <Button onClick={() => setIsFilterOpen(false)} className="flex-1">
                      Show {filteredProducts.length} Results
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Product grid */}
            <div className="flex-1">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-24 space-y-4">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  <p className="text-muted-foreground text-sm">Loading card inventory...</p>
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="text-center py-16 border rounded-lg bg-card">
                  <p className="text-lg font-semibold mb-2">No cards found matching your filters</p>
                  <p className="text-sm text-muted-foreground mb-4">Try clearing filters or search for another card</p>
                  <Button variant="outline" onClick={clearFilters}>
                    Clear Filters
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {filteredProducts.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      onAddToCart={() => addItem({
                        product_id: product.id,
                        product: {
                          id: product.id,
                          name: product.name,
                          slug: product.slug,
                          image_url: product.image_url || null,
                          price: product.price,
                          game: product.game,
                          rarity: product.rarity,
                        },
                      })}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </>
  )
}

export default function ShopPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    }>
      <ShopContent />
    </Suspense>
  )
}

function FilterSection({
  title,
  options,
  selected,
  onToggle,
  labels = {},
}: {
  title: string
  options: string[]
  selected: string[]
  onToggle: (value: string) => void
  labels?: Record<string, string>
}) {
  return (
    <div>
      <h3 className="font-semibold mb-3">{title}</h3>
      <div className="space-y-2">
        {options.map((option) => (
          <label key={option} className="flex items-center gap-2 cursor-pointer text-sm hover:text-primary transition-colors">
            <input
              type="checkbox"
              checked={selected.includes(option)}
              onChange={() => onToggle(option)}
              className="rounded border-input bg-background text-primary focus:ring-primary"
            />
            <span>{labels[option] || option.replace('_', ' ')}</span>
          </label>
        ))}
      </div>
    </div>
  )
}

function PriceFilter({
  range,
  onChange,
}: {
  range: [number, number]
  onChange: (range: [number, number]) => void
}) {
  return (
    <div>
      <h3 className="font-semibold mb-3">Price Range (JMD)</h3>
      <div className="space-y-2">
        <Input
          type="number"
          placeholder="Min"
          value={range[0] || ''}
          onChange={(e) => onChange([parseInt(e.target.value) || 0, range[1]])}
        />
        <Input
          type="number"
          placeholder="Max"
          value={range[1] || ''}
          onChange={(e) => onChange([range[0], parseInt(e.target.value) || 150000])}
        />
      </div>
    </div>
  )
}

function ProductCard({
  product,
  onAddToCart,
}: {
  product: Product
  onAddToCart: () => void
}) {
  const isOutOfStock = (product.stock_quantity ?? 0) <= 0
  const [imgError, setImgError] = useState(false)

  return (
    <Card className={cn(
      "group overflow-hidden hover:border-primary/50 transition-all flex flex-col justify-between bg-card hover:shadow-lg",
      isOutOfStock && "opacity-60"
    )}>
      <div className="relative aspect-[3/4] bg-muted/30 overflow-hidden flex items-center justify-center p-3">
        {product.image_url && !imgError ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={product.image_url}
            alt={product.name}
            className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
            onError={() => setImgError(true)}
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 flex flex-col items-center justify-center text-center p-4">
            <ImageIcon className="w-10 h-10 text-muted-foreground/40 mb-2" />
            <span className="font-semibold text-xs line-clamp-2">{product.name}</span>
            <span className="text-[10px] text-muted-foreground mt-1">{GAME_LABELS[product.game] || product.game}</span>
          </div>
        )}

        <Badge
          variant="outline"
          className={cn(
            'absolute top-2 left-2 text-[10px] font-semibold uppercase tracking-wider backdrop-blur-sm bg-background/80 shadow-sm',
            rarityColors[product.rarity] || 'bg-background'
          )}
        >
          {RARITY_LABELS[product.rarity] || product.rarity?.replace('_', ' ')}
        </Badge>

        {product.is_featured && (
          <Badge className="absolute top-2 right-2 bg-amber-500 text-black text-[10px] flex items-center gap-1 font-semibold">
            <Sparkles className="w-3 h-3" /> Featured
          </Badge>
        )}

        {isOutOfStock && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur-xs flex items-center justify-center">
            <span className="text-xs font-bold uppercase tracking-wider text-destructive bg-destructive/10 px-3 py-1 rounded-full">
              Out of Stock
            </span>
          </div>
        )}
      </div>

      <CardContent className="p-4 flex flex-col justify-between flex-1 border-t bg-card/50">
        <div>
          <Link href={`/shop/${product.slug || product.id}`}>
            <h3 className="font-semibold text-sm mb-1 line-clamp-1 group-hover:text-primary transition-colors">
              {product.name}
            </h3>
          </Link>
          <p className="text-xs text-muted-foreground mb-3 line-clamp-1">
            {product.set ? `${product.set} • ` : ''}
            {CONDITION_LABELS[product.condition] || product.condition?.replace('_', ' ')}
          </p>
        </div>

        <div className="flex items-center justify-between pt-2">
          <span className="text-base font-bold text-primary">
            {formatPrice(product.price)}
          </span>
          <Button
            size="sm"
            onClick={onAddToCart}
            disabled={isOutOfStock}
            className="h-8 text-xs font-medium"
          >
            <ShoppingCart className="w-3.5 h-3.5 mr-1" />
            Add
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}