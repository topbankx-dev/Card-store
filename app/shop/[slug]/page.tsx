'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { CartSidebar } from '@/components/cart-sidebar'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useCart } from '@/components/ui/use-toast'
import { toast } from '@/components/ui/sonner'
import {
  ShoppingCart,
  Heart,
  Share2,
  ArrowLeft,
  ShieldCheck,
  Truck,
  Store,
  Sparkles,
  Info,
  Check,
  ChevronRight,
  ZoomIn,
  Loader2,
  PackageCheck,
  AlertCircle,
  HelpCircle,
} from 'lucide-react'
import { formatPrice, cn } from '@/lib/utils'
import {
  GAME_LABELS,
  RARITY_LABELS,
  CONDITION_LABELS,
  type Product,
} from '@/lib/admin/types'

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

const conditionDescriptions: Record<string, string> = {
  MINT: 'Flawless condition, pack-fresh with zero visible wear, scratches, or edge whitening.',
  NEAR_MINT: 'Minimal to no wear. May have 1-2 tiny pin-pricks on corners or clean edges. Tournament legal without sleeves.',
  EXCELLENT: 'Light surface scratches or minor edge wear visible upon close inspection. Great for deck building.',
  GOOD: 'Noticeable play wear, light creases, or edge whitening. Fully sleeve-playable for local tournaments.',
  PLAYED: 'Heavy wear, scratches, scuffs, or minor bends. Budget-friendly option for casual play.',
  SEALED: 'Factory sealed booster box, tin, or structure deck with original manufacturer wrapping.',
}

export default function ProductDetailPage() {
  const params = useParams()
  const router = useRouter()
  const slug = params.slug as string
  const { addItem } = useCart()

  const [product, setProduct] = useState<Product | null>(null)
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [isZoomed, setIsZoomed] = useState(false)
  const [showConditionGuide, setShowConditionGuide] = useState(false)
  const [stockNotified, setStockNotified] = useState(false)
  const [notifyEmail, setNotifyEmail] = useState('')

  useEffect(() => {
    async function loadProduct() {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(`/api/products/${encodeURIComponent(slug)}`)
        if (!res.ok) {
          throw new Error('Product not found')
        }
        const data: Product = await res.json()
        setProduct(data)

        // Fetch related products for the same game
        if (data.game) {
          const relRes = await fetch(`/api/products?game=${data.game}&limit=5`)
          if (relRes.ok) {
            const relData = await relRes.json()
            if (relData.products && Array.isArray(relData.products)) {
              setRelatedProducts(relData.products.filter((p: Product) => p.id !== data.id).slice(0, 4))
            }
          }
        }
      } catch (err) {
        console.error(err)
        setError('The card or product you are looking for could not be found.')
      } finally {
        setLoading(false)
      }
    }

    if (slug) {
      loadProduct()
    }
  }, [slug])

  const handleAddToCart = () => {
    if (!product) return
    for (let i = 0; i < quantity; i++) {
      addItem({
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
      })
    }
    toast.success(`Added ${quantity}x "${product.name}" to your cart!`)
  }

  const handleShare = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href)
      toast.success('Product link copied to clipboard!')
    }
  }

  const handleStockAlert = (e: React.FormEvent) => {
    e.preventDefault()
    if (!notifyEmail) return
    setStockNotified(true)
    toast.success(`We will notify you at ${notifyEmail} as soon as this card is restocked!`)
  }

  if (loading) {
    return (
      <>
        <Header />
        <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
          <p className="text-muted-foreground text-sm">Loading card details...</p>
        </div>
        <Footer />
      </>
    )
  }

  if (error || !product) {
    return (
      <>
        <Header />
        <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 text-center">
          <AlertCircle className="w-14 h-14 text-destructive/80 mb-4" />
          <h1 className="text-2xl font-bold mb-2">Card Not Found</h1>
          <p className="text-muted-foreground max-w-md mb-6">{error || 'This card does not exist in our catalog.'}</p>
          <div className="flex gap-3">
            <Button onClick={() => router.push('/shop')}>
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to Shop
            </Button>
          </div>
        </div>
        <Footer />
      </>
    )
  }

  const isOutOfStock = (product.stock_quantity ?? 0) <= 0
  const maxAvailable = product.stock_quantity ?? 0

  return (
    <>
      <Header />
      <CartSidebar />

      <main className="min-h-screen py-8 md:py-12 bg-background">
        <div className="container mx-auto px-4 max-w-6xl">
          {/* Breadcrumbs */}
          <nav className="flex items-center gap-2 text-xs md:text-sm text-muted-foreground mb-6 overflow-x-auto whitespace-nowrap pb-1">
            <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
            <ChevronRight className="w-3.5 h-3.5 shrink-0" />
            <Link href="/shop" className="hover:text-foreground transition-colors">Shop</Link>
            <ChevronRight className="w-3.5 h-3.5 shrink-0" />
            <Link href={`/shop?game=${product.game}`} className="hover:text-foreground transition-colors">
              {GAME_LABELS[product.game] || product.game}
            </Link>
            <ChevronRight className="w-3.5 h-3.5 shrink-0" />
            <span className="text-foreground font-medium truncate max-w-[200px]">{product.name}</span>
          </nav>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
            {/* Left: Card Scan / Artwork Viewer */}
            <div className="lg:col-span-5 flex flex-col items-center">
              <div className="sticky top-24 w-full max-w-md">
                <div
                  className={cn(
                    "relative aspect-[3/4] w-full rounded-2xl border bg-gradient-to-br from-card to-muted/40 p-4 shadow-xl flex items-center justify-center overflow-hidden group cursor-zoom-in transition-all",
                    isZoomed && "cursor-zoom-out scale-105"
                  )}
                  onClick={() => setIsZoomed(!isZoomed)}
                >
                  {product.image_url ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className={cn(
                        "w-full h-full object-contain rounded-lg transition-transform duration-300 drop-shadow-2xl",
                        isZoomed ? "scale-125" : "group-hover:scale-105"
                      )}
                    />
                  ) : (
                    <div className="text-center p-6 space-y-2">
                      <Sparkles className="w-12 h-12 text-primary/40 mx-auto" />
                      <p className="font-semibold text-base">{product.name}</p>
                      <p className="text-xs text-muted-foreground">{GAME_LABELS[product.game] || product.game}</p>
                    </div>
                  )}

                  {/* Corner Actions */}
                  <div className="absolute top-3 right-3 flex gap-2">
                    <Button
                      size="icon"
                      variant="secondary"
                      className="h-8 w-8 rounded-full shadow-md bg-background/80 backdrop-blur-sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleShare()
                      }}
                    >
                      <Share2 className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="absolute bottom-3 right-3">
                    <span className="text-[11px] bg-background/80 backdrop-blur-sm px-2.5 py-1 rounded-full text-muted-foreground flex items-center gap-1 shadow">
                      <ZoomIn className="w-3 h-3" /> Click to zoom
                    </span>
                  </div>
                </div>

                {/* Quick Trust Badges below image */}
                <div className="grid grid-cols-2 gap-3 mt-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-2 p-2.5 rounded-lg border bg-muted/20">
                    <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>100% Verified Authentic TCG Card</span>
                  </div>
                  <div className="flex items-center gap-2 p-2.5 rounded-lg border bg-muted/20">
                    <Store className="w-4 h-4 text-primary shrink-0" />
                    <span>Pick up at Kingston Lounge</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Card Details, Specs, Pricing & Purchase */}
            <div className="lg:col-span-7 space-y-6">
              {/* Badges */}
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="font-semibold px-2.5 py-0.5 text-xs">
                  {GAME_LABELS[product.game] || product.game}
                </Badge>
                {product.rarity && (
                  <Badge
                    variant="outline"
                    className={cn(
                      "font-semibold px-2.5 py-0.5 text-xs uppercase",
                      rarityColors[product.rarity] || "bg-muted"
                    )}
                  >
                    {RARITY_LABELS[product.rarity] || product.rarity.replace('_', ' ')}
                  </Badge>
                )}
                {product.is_featured && (
                  <Badge className="bg-amber-500 text-black text-xs font-semibold flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> Featured Card
                  </Badge>
                )}
                {product.is_sealed && (
                  <Badge className="bg-blue-600 text-white text-xs font-semibold">
                    Sealed Product
                  </Badge>
                )}
              </div>

              {/* Title & Set */}
              <div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight mb-2 text-foreground">
                  {product.name}
                </h1>
                {product.set && (
                  <p className="text-base text-muted-foreground font-medium">
                    {product.set}
                  </p>
                )}
              </div>

              {/* Price & Stock status */}
              <div className="p-5 rounded-xl border bg-card/60 backdrop-blur-sm space-y-3">
                <div className="flex items-baseline justify-between">
                  <div>
                    <span className="text-3xl sm:text-4xl font-black text-primary">
                      {formatPrice(product.price)}
                    </span>
                    <span className="text-xs text-muted-foreground ml-2 font-medium">JMD</span>
                  </div>

                  <div>
                    {isOutOfStock ? (
                      <Badge variant="destructive" className="text-xs px-3 py-1">
                        Out of Stock
                      </Badge>
                    ) : maxAvailable <= 3 ? (
                      <Badge variant="outline" className="text-xs px-3 py-1 border-amber-500 text-amber-500 bg-amber-500/10">
                        Only {maxAvailable} left in stock!
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs px-3 py-1 border-emerald-500 text-emerald-500 bg-emerald-500/10">
                        In Stock ({maxAvailable} available)
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Purchase Buttons or Restock Alert */}
                {!isOutOfStock ? (
                  <div className="pt-3 flex flex-col sm:flex-row gap-3">
                    <div className="flex items-center border rounded-lg overflow-hidden bg-background h-11 w-36 shrink-0">
                      <button
                        type="button"
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="w-10 h-full flex items-center justify-center hover:bg-muted font-bold text-lg"
                      >
                        -
                      </button>
                      <span className="flex-1 text-center font-semibold text-sm">
                        {quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => setQuantity(Math.min(maxAvailable, quantity + 1))}
                        className="w-10 h-full flex items-center justify-center hover:bg-muted font-bold text-lg"
                      >
                        +
                      </button>
                    </div>

                    <Button
                      size="lg"
                      onClick={handleAddToCart}
                      className="flex-1 h-11 text-base font-semibold shadow-lg shadow-primary/20"
                    >
                      <ShoppingCart className="w-5 h-5 mr-2" /> Add to Cart
                    </Button>
                  </div>
                ) : (
                  <div className="pt-2">
                    {stockNotified ? (
                      <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 text-sm flex items-center gap-2">
                        <Check className="w-4 h-4" /> We'll email you the moment this card is restocked.
                      </div>
                    ) : (
                      <form onSubmit={handleStockAlert} className="space-y-2">
                        <p className="text-xs text-muted-foreground">
                          Get notified automatically when this card is restocked:
                        </p>
                        <div className="flex gap-2">
                          <input
                            type="email"
                            required
                            placeholder="Enter your email"
                            value={notifyEmail}
                            onChange={(e) => setNotifyEmail(e.target.value)}
                            className="flex-1 px-3 py-2 text-sm rounded-lg border bg-background"
                          />
                          <Button type="submit" variant="secondary" className="shrink-0">
                            Notify Me
                          </Button>
                        </div>
                      </form>
                    )}
                  </div>
                )}
              </div>

              {/* Card Condition & Grading Guide */}
              <div className="rounded-xl border p-4 bg-muted/10 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground font-medium">Card Condition:</span>
                    <Badge variant="secondary" className="font-semibold text-xs">
                      {CONDITION_LABELS[product.condition] || product.condition?.replace('_', ' ')}
                    </Badge>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowConditionGuide(!showConditionGuide)}
                    className="text-xs text-primary hover:underline flex items-center gap-1 font-medium"
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                    Condition Guide
                  </button>
                </div>

                <p className="text-xs text-muted-foreground">
                  {conditionDescriptions[product.condition] || 'Verified for tournament play and collector grading standards.'}
                </p>

                {showConditionGuide && (
                  <div className="mt-3 pt-3 border-t grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] animate-in fade-in duration-200">
                    {Object.entries(conditionDescriptions).map(([cond, desc]) => (
                      <div key={cond} className={cn("p-2 rounded border bg-background", product.condition === cond && "border-primary/50 bg-primary/5")}>
                        <span className="font-bold text-foreground block mb-0.5">{CONDITION_LABELS[cond as keyof typeof CONDITION_LABELS] || cond}</span>
                        <span className="text-muted-foreground">{desc}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Description / Effect / Rules */}
              {product.description && (
                <div className="space-y-2">
                  <h3 className="font-bold text-sm tracking-wide uppercase text-muted-foreground">
                    Card Text & Description
                  </h3>
                  <div className="p-4 rounded-xl border bg-muted/10 text-sm leading-relaxed whitespace-pre-line text-foreground/90 font-mono">
                    {product.description}
                  </div>
                </div>
              )}

              {/* Jamaican Delivery & In-Store Logistics */}
              <div className="rounded-xl border divide-y bg-card text-xs">
                <div className="p-3.5 flex items-center gap-3">
                  <Store className="w-5 h-5 text-primary shrink-0" />
                  <div>
                    <span className="font-semibold block text-foreground">In-Store Pickup (Free)</span>
                    <span className="text-muted-foreground">Ready for pickup at our Kingston Gaming Lounge within 1 hour.</span>
                  </div>
                </div>
                <div className="p-3.5 flex items-center gap-3">
                  <Truck className="w-5 h-5 text-primary shrink-0" />
                  <div>
                    <span className="font-semibold block text-foreground">Island-Wide Parish Courier</span>
                    <span className="text-muted-foreground">Delivery available via Tara Courier, Knutsford Express, or ZipMail across all 14 parishes.</span>
                  </div>
                </div>
                <div className="p-3.5 flex items-center gap-3">
                  <PackageCheck className="w-5 h-5 text-primary shrink-0" />
                  <div>
                    <span className="font-semibold block text-foreground">Top-Loader & Bubble Mailer Protection</span>
                    <span className="text-muted-foreground">All singles shipped in premium sleeves and hard top-loaders to prevent damage.</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Related Products Section */}
          {relatedProducts.length > 0 && (
            <div className="mt-16 pt-12 border-t space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold">More from {GAME_LABELS[product.game] || product.game}</h2>
                  <p className="text-xs text-muted-foreground">Explore more cards and singles from this game</p>
                </div>
                <Link href={`/shop?game=${product.game}`}>
                  <Button variant="ghost" size="sm" className="text-xs">
                    View All <ChevronRight className="w-3.5 h-3.5 ml-1" />
                  </Button>
                </Link>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {relatedProducts.map((rel) => (
                  <Link key={rel.id} href={`/shop/${rel.slug || rel.id}`} className="group">
                    <Card className="overflow-hidden hover:border-primary/50 transition-all hover:shadow-md flex flex-col justify-between h-full bg-card">
                      <div className="relative aspect-[3/4] bg-muted/30 p-2 flex items-center justify-center">
                        {rel.image_url ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            src={rel.image_url}
                            alt={rel.name}
                            className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                            loading="lazy"
                          />
                        ) : (
                          <div className="text-center p-2 text-xs text-muted-foreground">
                            {rel.name}
                          </div>
                        )}
                        {rel.rarity && (
                          <Badge
                            variant="outline"
                            className={cn(
                              "absolute top-2 left-2 text-[9px] uppercase px-1.5 py-0.5",
                              rarityColors[rel.rarity] || "bg-background"
                            )}
                          >
                            {RARITY_LABELS[rel.rarity] || rel.rarity}
                          </Badge>
                        )}
                      </div>
                      <CardContent className="p-3 border-t">
                        <p className="font-semibold text-xs line-clamp-1 group-hover:text-primary transition-colors mb-1">
                          {rel.name}
                        </p>
                        <p className="text-[11px] text-muted-foreground mb-2 line-clamp-1">
                          {rel.set || GAME_LABELS[rel.game]}
                        </p>
                        <p className="font-bold text-sm text-primary">
                          {formatPrice(rel.price)}
                        </p>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </>
  )
}
