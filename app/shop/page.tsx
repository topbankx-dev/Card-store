'use client'

import { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { useCart } from '@/components/ui/use-toast'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { CartSidebar } from '@/components/cart-sidebar'
import { Filter, Search, ShoppingCart, Heart, X } from 'lucide-react'
import { formatPrice, cn } from '@/lib/utils'
import Link from 'next/link'

// Sample product data - in production, this comes from the database
const sampleProducts = [
  {
    id: '1',
    name: 'Blue-Eyes White Dragon',
    slug: 'blue-eyes-white-dragon',
    game: 'YGO',
    set: 'Legend of Blue Eyes',
    rarity: 'ULTRA_RARE',
    condition: 'NEAR_MINT',
    price: 4500,
    stock_quantity: 3,
    image_url: '/images/blue-eyes.jpg',
  },
  {
    id: '2',
    name: 'Charizard VMAX Rainbow',
    slug: 'charizard-vmax-rainbow',
    game: 'POKEMON',
    set: 'Darkness Ablaze',
    rarity: 'SECRET_RARE',
    condition: 'NEAR_MINT',
    price: 12500,
    stock_quantity: 1,
    image_url: '/images/charizard.jpg',
  },
  {
    id: '3',
    name: 'Black Lotus',
    slug: 'black-lotus',
    game: 'MTG',
    set: 'Alpha',
    rarity: 'MYTHIC',
    condition: 'EXCELLENT',
    price: 85000,
    stock_quantity: 1,
    image_url: '/images/black-lotus.jpg',
  },
  {
    id: '4',
    name: 'Luffy Gear 5 SR',
    slug: 'luffy-gear-5-sr',
    game: 'ONE_PIECE',
    set: 'Paramount War',
    rarity: 'SUPER_RARE',
    condition: 'NEAR_MINT',
    price: 3200,
    stock_quantity: 5,
    image_url: '/images/luffy.jpg',
  },
  {
    id: '5',
    name: 'Dark Magician Girl',
    slug: 'dark-magician-girl',
    game: 'YGO',
    set: "Magician's Force",
    rarity: 'SUPER_RARE',
    condition: 'NEAR_MINT',
    price: 5500,
    stock_quantity: 2,
    image_url: '/images/dark-magician-girl.jpg',
  },
  {
    id: '6',
    name: 'Pikachu V Union',
    slug: 'pikachu-v-union',
    game: 'POKEMON',
    set: 'Brilliant Stars',
    rarity: 'PROMO',
    condition: 'NEAR_MINT',
    price: 2800,
    stock_quantity: 4,
    image_url: '/images/pikachu.jpg',
  },
  {
    id: '7',
    name: 'Sora Revolver Dragon',
    slug: 'sora-revolver-dragon',
    game: 'YGO',
    set: 'Dawn of Majesty',
    rarity: 'SECRET_RARE',
    condition: 'MINT',
    price: 7800,
    stock_quantity: 2,
    image_url: '/images/sora.jpg',
  },
  {
    id: '8',
    name: ' Mewtwo VSTAR',
    slug: 'mewtwo-vstar',
    game: 'POKEMON',
    set: 'Shining Fates',
    rarity: 'ULTRA_RARE',
    condition: 'NEAR_MINT',
    price: 6500,
    stock_quantity: 3,
    image_url: '/images/mewtwo.jpg',
  },
  {
    id: '9',
    name: 'Time Walk',
    slug: 'time-walk',
    game: 'MTG',
    set: 'Beta',
    rarity: 'MYTHIC',
    condition: 'GOOD',
    price: 45000,
    stock_quantity: 1,
    image_url: '/images/timewalk.jpg',
  },
  {
    id: '10',
    name: 'Yamato VMAX',
    slug: 'yamato-vmax',
    game: 'ONE_PIECE',
    set: 'Kingdoms of Intrigue',
    rarity: 'SUPER_RARE',
    condition: 'NEAR_MINT',
    price: 4200,
    stock_quantity: 6,
    image_url: '/images/yamato.jpg',
  },
]

const games = ['YGO', 'POKEMON', 'MTG', 'ONE_PIECE']
const rarities = ['COMMON', 'UNCOMMON', 'RARE', 'SUPER_RARE', 'ULTRA_RARE', 'SECRET_RARE', 'MYTHIC', 'PROMO']
const conditions = ['MINT', 'NEAR_MINT', 'EXCELLENT', 'GOOD', 'PLAYED']

const gameLabels: Record<string, string> = {
  YGO: 'Yu-Gi-Oh!',
  POKEMON: 'Pokémon',
  MTG: 'Magic: The Gathering',
  ONE_PIECE: 'One Piece',
}

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

// Inner component that uses useSearchParams — must be wrapped in Suspense
function ShopContent() {
  const searchParams = useSearchParams()
  const { addItem } = useCart()

  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedGames, setSelectedGames] = useState<string[]>(
    searchParams.get('game') ? [searchParams.get('game')!] : []
  )
  const [selectedRarities, setSelectedRarities] = useState<string[]>([])
  const [selectedConditions, setSelectedConditions] = useState<string[]>([])
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 100000])

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
    setPriceRange([0, 100000])
    setSearchQuery('')
  }

  // Filter products
  const filteredProducts = sampleProducts.filter(product => {
    // Search query
    if (searchQuery && !product.name.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false
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
              <h1 className="text-3xl font-bold">Shop Cards</h1>
              <p className="text-muted-foreground">
                {filteredProducts.length} cards available
              </p>
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto">
              <div className="relative flex-1 md:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search cards..."
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
                  labels={gameLabels}
                />

                <FilterSection
                  title="Rarity"
                  options={rarities}
                  selected={selectedRarities}
                  onToggle={(v) => toggleFilter('rarity', v)}
                  labels={rarityLabels}
                />

                <FilterSection
                  title="Condition"
                  options={conditions}
                  selected={selectedConditions}
                  onToggle={(v) => toggleFilter('condition', v)}
                  labels={conditionLabels}
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

                  <div className="space-y-6">
                    <FilterSection
                      title="Game"
                      options={games}
                      selected={selectedGames}
                      onToggle={(v) => toggleFilter('game', v)}
                      labels={gameLabels}
                    />

                    <FilterSection
                      title="Rarity"
                      options={rarities}
                      selected={selectedRarities}
                      onToggle={(v) => toggleFilter('rarity', v)}
                      labels={rarityLabels}
                    />

                    <FilterSection
                      title="Condition"
                      options={conditions}
                      selected={selectedConditions}
                      onToggle={(v) => toggleFilter('condition', v)}
                      labels={conditionLabels}
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
              {filteredProducts.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-lg text-muted-foreground mb-4">
                    No cards found matching your filters
                  </p>
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
                          image_url: product.image_url,
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

// Exported page wraps ShopContent in Suspense — required by Next.js when using useSearchParams()
export default function ShopPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Loading shop...</div>
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
          <label key={option} className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={selected.includes(option)}
              onChange={() => onToggle(option)}
              className="rounded border-input bg-background text-primary focus:ring-primary"
            />
            <span className="text-sm">
              {labels[option] || option.replace('_', ' ')}
            </span>
          </label>
        ))}
      </div>
    </div>
  )
}

// Price Filter Component
function PriceFilter({
  range,
  onChange,
}: {
  range: [number, number]
  onChange: (range: [number, number]) => void
}) {
  return (
    <div>
      <h3 className="font-semibold mb-3">Price Range</h3>
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
          onChange={(e) => onChange([range[0], parseInt(e.target.value) || 100000])}
        />
      </div>
    </div>
  )
}

// Product Card Component
function ProductCard({
  product,
  onAddToCart,
}: {
  product: typeof sampleProducts[0]
  onAddToCart: () => void
}) {
  const isOutOfStock = product.stock_quantity === 0

  return (
    <Card className={cn(
      "group overflow-hidden hover:border-primary/50 transition-all",
      isOutOfStock && "opacity-60"
    )}>
      <div className="relative aspect-[3/4] bg-gradient-to-br from-purple-900/20 to-blue-900/20">
        {/* Placeholder */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-24 h-36 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-xs text-muted-foreground text-center p-2">
            {product.name}
          </div>
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 h-8 w-8 bg-background/50 backdrop-blur-sm hover:bg-background/80"
        >
          <Heart className="w-4 h-4" />
        </Button>

        <Badge
          variant="outline"
          className={cn(
            'absolute top-2 left-2',
            rarityColors[product.rarity]
          )}
        >
          {product.rarity.replace('_', ' ')}
        </Badge>

        {isOutOfStock && (
          <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
            <span className="text-sm font-medium text-destructive">Out of Stock</span>
          </div>
        )}
      </div>

      <CardContent className="p-4">
        <Link href={`/shop/${product.slug}`}>
          <h3 className="font-semibold mb-1 line-clamp-1 group-hover:text-primary transition-colors">
            {product.name}
          </h3>
        </Link>
        <p className="text-xs text-muted-foreground mb-2">
          {product.set} • {product.condition.replace('_', ' ')}
        </p>
        <div className="flex items-center justify-between">
          <span className="text-lg font-bold text-primary">
            {formatPrice(product.price)}
          </span>
          <Button
            size="sm"
            onClick={onAddToCart}
            disabled={isOutOfStock}
          >
            <ShoppingCart className="w-3 h-3 mr-1" />
            Add
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

const rarityLabels: Record<string, string> = {
  COMMON: 'Common',
  UNCOMMON: 'Uncommon',
  RARE: 'Rare',
  SUPER_RARE: 'Super Rare',
  ULTRA_RARE: 'Ultra Rare',
  SECRET_RARE: 'Secret Rare',
  MYTHIC: 'Mythic',
  PROMO: 'Promo',
}

const conditionLabels: Record<string, string> = {
  MINT: 'Mint',
  NEAR_MINT: 'Near Mint',
  EXCELLENT: 'Excellent',
  GOOD: 'Good',
  PLAYED: 'Played',
}