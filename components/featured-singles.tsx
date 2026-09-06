'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useCart } from '@/components/ui/use-toast'
import { ShoppingCart, Heart, ChevronLeft, ChevronRight } from 'lucide-react'
import { formatPrice, cn } from '@/lib/utils'
import { useState, useRef } from 'react'

// Sample featured cards - in production, these come from the database
const featuredCards = [
  {
    id: '1',
    name: 'Blue-Eyes White Dragon',
    slug: 'blue-eyes-white-dragon',
    game: 'YGO',
    set: 'Legend of Blue Eyes',
    rarity: 'ULTRA_RARE',
    condition: 'NEAR_MINT',
    price: 4500,
    image_url: '/images/blue-eyes.jpg',
    description: 'Legendary dragon card, must-have for collectors',
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
    image_url: '/images/charizard.jpg',
    description: 'Beautiful rainbow rare Charizard card',
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
    image_url: '/images/black-lotus.jpg',
    description: 'Iconic MTG card, vintage Alpha edition',
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
    image_url: '/images/luffy.jpg',
    description: 'Special alternate art Luffy leader',
  },
  {
    id: '5',
    name: 'Pikachu V Union',
    slug: 'pikachu-v-union',
    game: 'POKEMON',
    set: 'Brilliant Stars',
    rarity: 'PROMO',
    condition: 'NEAR_MINT',
    price: 2800,
    image_url: '/images/pikachu.jpg',
    description: '4-card promo set, great for tournament play',
  },
  {
    id: '6',
    name: 'Dark Magician Girl',
    slug: 'dark-magician-girl',
    game: 'YGO',
    set: 'Magician\'s Force',
    rarity: 'SUPER_RARE',
    condition: 'NEAR_MINT',
    price: 5500,
    image_url: '/images/dark-magician-girl.jpg',
    description: 'Classic Yu-Gi-Oh card, fan favorite',
  },
]

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

export function FeaturedSingles() {
  const { addItem } = useCart()
  const scrollRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current
      setCanScrollLeft(scrollLeft > 0)
      setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 10)
    }
  }

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 300
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      })
    }
  }

  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold mb-2">
              Featured Singles
            </h2>
            <p className="text-muted-foreground">
              Hand-picked cards from our collection
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => scroll('left')}
              disabled={!canScrollLeft}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => scroll('right')}
              disabled={!canScrollRight}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
            <Link href="/shop">
              <Button>
                View All
              </Button>
            </Link>
          </div>
        </div>

        <div
          ref={scrollRef}
          onScroll={checkScroll}
          className="flex gap-4 overflow-x-auto scroll-smooth pb-4 -mx-4 px-4 scrollbar-hide"
          style={{ scrollbarWidth: 'none' }}
        >
          {featuredCards.map((card) => (
            <Card
              key={card.id}
              className="group flex-shrink-0 w-[260px] overflow-hidden hover:border-primary/50 transition-all hover:shadow-lg"
            >
              <div className="relative aspect-[3/4] bg-gradient-to-br from-purple-900/20 to-blue-900/20 overflow-hidden">
                {/* Placeholder for card image */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-32 h-44 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-xs text-muted-foreground text-center p-2">
                    {card.name}
                  </div>
                </div>
                {/* Wishlist button */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 h-8 w-8 bg-background/50 backdrop-blur-sm hover:bg-background/80"
                >
                  <Heart className="w-4 h-4" />
                </Button>
                {/* Rarity badge */}
                <Badge
                  variant="outline"
                  className={cn(
                    'absolute top-2 left-2',
                    rarityColors[card.rarity]
                  )}
                >
                  {card.rarity.replace('_', ' ')}
                </Badge>
              </div>
              <CardContent className="p-4">
                <h3 className="font-semibold mb-1 line-clamp-1 group-hover:text-primary transition-colors">
                  {card.name}
                </h3>
                <p className="text-xs text-muted-foreground mb-3 line-clamp-1">
                  {card.set} • {card.condition.replace('_', ' ')}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-primary">
                    {formatPrice(card.price)}
                  </span>
                  <Button
                    size="sm"
                    onClick={() =>
                      addItem({
                        product_id: card.id,
                        product: {
                          id: card.id,
                          name: card.name,
                          slug: card.slug,
                          image_url: card.image_url,
                          price: card.price,
                          game: card.game,
                          rarity: card.rarity,
                        },
                      })
                    }
                  >
                    <ShoppingCart className="w-3 h-3 mr-1" />
                    Add
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}