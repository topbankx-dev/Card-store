'use client'

import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useCart } from '@/components/ui/use-toast'
import { ShoppingCart, Heart, ChevronLeft, ChevronRight, ImageIcon, Sparkles, Loader2 } from 'lucide-react'
import { formatPrice, cn } from '@/lib/utils'
import { useState, useRef, useEffect } from 'react'
import { GAME_LABELS, RARITY_LABELS, CONDITION_LABELS, type Product } from '@/lib/admin/types'

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
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadFeatured() {
      try {
        const res = await fetch('/api/products?limit=12')
        if (res.ok) {
          const json = await res.json()
          if (json.products && Array.isArray(json.products)) {
            setProducts(json.products)
          }
        }
      } catch (e) {
        console.error('Failed to load featured singles:', e)
      } finally {
        setLoading(false)
      }
    }
    loadFeatured()
  }, [])

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

  if (!loading && products.length === 0) {
    return null
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
              Hand-picked cards & tournament staples from our collection
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

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <div
            ref={scrollRef}
            onScroll={checkScroll}
            className="flex gap-4 overflow-x-auto scroll-smooth pb-4 -mx-4 px-4 scrollbar-hide"
            style={{ scrollbarWidth: 'none' }}
          >
            {products.map((card) => (
              <Card
                key={card.id}
                className="group flex-shrink-0 w-[260px] overflow-hidden hover:border-primary/50 transition-all hover:shadow-lg flex flex-col justify-between"
              >
                <div className="relative aspect-[3/4] bg-muted/30 overflow-hidden flex items-center justify-center p-3">
                  {card.image_url ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={card.image_url}
                      alt={card.name}
                      className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 flex flex-col items-center justify-center text-center p-4">
                      <ImageIcon className="w-10 h-10 text-muted-foreground/40 mb-2" />
                      <span className="font-semibold text-xs line-clamp-2">{card.name}</span>
                      <span className="text-[10px] text-muted-foreground mt-1">{GAME_LABELS[card.game] || card.game}</span>
                    </div>
                  )}

                  {/* Rarity badge */}
                  <Badge
                    variant="outline"
                    className={cn(
                      'absolute top-2 left-2 text-[10px] font-semibold uppercase tracking-wider backdrop-blur-sm bg-background/80 shadow-sm',
                      rarityColors[card.rarity] || 'bg-background'
                    )}
                  >
                    {RARITY_LABELS[card.rarity] || card.rarity?.replace('_', ' ')}
                  </Badge>

                  {card.is_featured && (
                    <Badge className="absolute top-2 right-2 bg-amber-500 text-black text-[10px] flex items-center gap-1 font-semibold">
                      <Sparkles className="w-3 h-3" /> Featured
                    </Badge>
                  )}
                </div>
                <CardContent className="p-4 border-t bg-card/50 flex flex-col justify-between flex-1">
                  <div>
                    <Link href={`/shop/${card.slug || card.id}`}>
                      <h3 className="font-semibold text-sm mb-1 line-clamp-1 group-hover:text-primary transition-colors">
                        {card.name}
                      </h3>
                    </Link>
                    <p className="text-xs text-muted-foreground mb-3 line-clamp-1">
                      {card.set ? `${card.set} • ` : ''}{CONDITION_LABELS[card.condition] || card.condition?.replace('_', ' ')}
                    </p>
                  </div>
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-base font-bold text-primary">
                      {formatPrice(card.price)}
                    </span>
                    <Button
                      size="sm"
                      className="h-8 text-xs font-medium"
                      onClick={() =>
                        addItem({
                          product_id: card.id,
                          product: {
                            id: card.id,
                            name: card.name,
                            slug: card.slug,
                            image_url: card.image_url || null,
                            price: card.price,
                            game: card.game,
                            rarity: card.rarity,
                          },
                        })
                      }
                    >
                      <ShoppingCart className="w-3.5 h-3.5 mr-1" />
                      Add
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}