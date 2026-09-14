'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { GAME_LABELS, RARITY_LABELS, CONDITION_LABELS, type Product, type Rarity } from '@/lib/admin/types'
import { cn } from '@/lib/utils'
import { Loader2, Sparkles, Search, Check, Wand2, X } from 'lucide-react'
import { ImageUpload } from '@/components/admin/image-upload'
import { toast } from '@/components/ui/sonner'

interface ProductFormProps {
  product?: Partial<Product>
  onSubmit?: (data: Partial<Product>) => Promise<void>
  isEditing?: boolean
}

interface TcgSearchResult {
  name: string
  game: string
  set?: string
  rarity?: string
  price?: number
  image_url?: string
  description?: string
  variant_label?: string
}

export function ProductForm({ product, onSubmit, isEditing = false }: ProductFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // TCG Lookup state
  const [tcgQuery, setTcgQuery] = useState('')
  const [tcgSearching, setTcgSearching] = useState(false)
  const [tcgResults, setTcgResults] = useState<TcgSearchResult[]>([])

  const [formData, setFormData] = useState<Partial<Product>>({
    name: product?.name || '',
    slug: product?.slug || '',
    game: product?.game || 'YGO',
    set: product?.set || '',
    rarity: product?.rarity || 'COMMON',
    condition: product?.condition || 'NEAR_MINT',
    price: product?.price || 0,
    stock_quantity: product?.stock_quantity ?? 1,
    image_url: product?.image_url || '',
    description: product?.description || '',
    is_featured: product?.is_featured || false,
    is_sealed: product?.is_sealed || false,
  })

  // Synchronize formData when product loads or updates
  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || '',
        slug: product.slug || '',
        game: product.game || 'YGO',
        set: product.set || '',
        rarity: product.rarity || 'COMMON',
        condition: product.condition || 'NEAR_MINT',
        price: product.price || 0,
        stock_quantity: product.stock_quantity ?? 1,
        image_url: product.image_url || '',
        description: product.description || '',
        is_featured: product.is_featured || false,
        is_sealed: product.is_sealed || false,
      })
    }
  }, [product])

  const handleChange = (field: keyof Product, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }))
    }

    // Auto-generate slug from name
    if (field === 'name' && !isEditing) {
      const slug = (value as string)
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '')
      setFormData((prev) => ({ ...prev, slug }))
    }
  }

  // TCG API Lookup
  const handleTcgSearch = async () => {
    if (!tcgQuery.trim()) {
      toast.error('Please enter a card name or set code')
      return
    }

    setTcgSearching(true)
    setTcgResults([])
    try {
      const res = await fetch(`/api/admin/tcg-lookup?q=${encodeURIComponent(tcgQuery)}&game=${formData.game || 'YGO'}`)
      if (!res.ok) throw new Error('Search failed')
      const data = await res.json()
      setTcgResults(data.results || [])
      if (!data.results || data.results.length === 0) {
        toast.info('No matching cards found via TCG API')
      }
    } catch (err) {
      console.error(err)
      toast.error('Failed to lookup card details')
    } finally {
      setTcgSearching(false)
    }
  }

  const normalizeRarity = (rarityStr?: string): Rarity => {
    if (!rarityStr) return 'COMMON'
    const normalized = rarityStr.toUpperCase().replace(/\s+/g, '_')
    const validRarities: Rarity[] = ['COMMON', 'UNCOMMON', 'RARE', 'SUPER_RARE', 'ULTRA_RARE', 'SECRET_RARE', 'MYTHIC', 'PROMO']
    if (validRarities.includes(normalized as Rarity)) {
      return normalized as Rarity
    }
    if (normalized.includes('SUPER')) return 'SUPER_RARE'
    if (normalized.includes('ULTRA')) return 'ULTRA_RARE'
    if (normalized.includes('SECRET')) return 'SECRET_RARE'
    if (normalized.includes('MYTHIC')) return 'MYTHIC'
    if (normalized.includes('PROMO')) return 'PROMO'
    if (normalized.includes('UNCOMMON')) return 'UNCOMMON'
    if (normalized.includes('RARE')) return 'RARE'
    return 'COMMON'
  }

  const applyTcgCard = (card: TcgSearchResult) => {
    const slug = card.name
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')

    // Approximate USD to JMD conversion for initial baseline if needed (e.g. 155 JMD per USD)
    // Or keep USD numeric depending on currency mode
    const priceJMD = card.price ? Math.round(card.price * 155) : 500

    setFormData((prev) => ({
      ...prev,
      name: card.name,
      slug,
      set: card.set || prev.set || '',
      rarity: normalizeRarity(card.rarity || prev.rarity),
      image_url: card.image_url || prev.image_url || '',
      description: card.description || prev.description || '',
      price: priceJMD,
    }))

    setTcgResults([])
    toast.success(`Auto-filled details for "${card.name}"!`)
  }

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.name?.trim()) {
      newErrors.name = 'Product name is required'
    }
    if (!formData.game) {
      newErrors.game = 'Game is required'
    }
    if (!formData.price || formData.price <= 0) {
      newErrors.price = 'Price must be greater than 0'
    }
    if (formData.stock_quantity === undefined || formData.stock_quantity < 0) {
      newErrors.stock_quantity = 'Stock quantity must be 0 or more'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validate()) return

    setLoading(true)
    try {
      if (onSubmit) {
        await onSubmit(formData)
      } else {
        const url = isEditing && product?.id
          ? `/api/admin/products/${product.id}`
          : '/api/admin/products'

        const method = isEditing ? 'PUT' : 'POST'

        const response = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        })

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}))
          throw new Error(errData.error || 'Failed to save product')
        }

        toast.success(isEditing ? 'Product updated successfully' : 'Product created successfully')
        router.push('/admin/products')
        router.refresh()
      }
    } catch (error: unknown) {
      console.error('Error saving product:', error)
      const msg = (error as Error)?.message || 'Failed to save product. Please try again.'
      setErrors({ submit: msg })
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {errors.submit && (
        <div className="p-4 rounded-lg bg-destructive/10 text-destructive text-sm">
          {errors.submit}
        </div>
      )}

      {/* TCG Auto-Fill Bar */}
      <Card className="border-primary/30 bg-primary/5">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Wand2 className="w-5 h-5 text-primary" />
            TCG Card Auto-Fill (YGOPRODeck / Scryfall / Pokémon API)
          </CardTitle>
          <CardDescription>
            Search by card name to automatically import or update the card image, rarity, set name, and description.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Input
              placeholder="e.g. Ash Blossom, Blue-Eyes, Black Lotus, Charizard ex..."
              value={tcgQuery}
              onChange={(e) => setTcgQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  handleTcgSearch()
                }
              }}
            />
            <Button
              type="button"
              onClick={handleTcgSearch}
              disabled={tcgSearching}
              className="shrink-0"
            >
              {tcgSearching ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Search className="w-4 h-4 mr-2" />
              )}
              Search TCG API
            </Button>
          </div>

          {/* Live Card Results Carousel / List */}
          {tcgResults.length > 0 && (
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between pb-1 border-b">
                <span className="text-xs font-semibold text-primary">
                  Found {tcgResults.length} Printings & Variants
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setTcgResults([])}
                  className="h-6 text-xs text-muted-foreground hover:text-foreground px-2"
                >
                  <X className="w-3.5 h-3.5 mr-1" />
                  Dismiss
                </Button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-[460px] overflow-y-auto p-1">
                {tcgResults.map((card, idx) => (
                  <div
                    key={idx}
                    onClick={() => applyTcgCard(card)}
                    className="border rounded-xl p-2.5 bg-background hover:border-primary cursor-pointer transition-all hover:shadow-md flex flex-col justify-between text-left group relative"
                  >
                    <div>
                      {card.image_url && (
                        <div className="w-full h-36 relative mb-2 bg-muted rounded-lg overflow-hidden flex items-center justify-center border border-border/40">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={card.image_url}
                            alt={card.name}
                            className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform"
                          />
                        </div>
                      )}
                      <p className="font-bold text-xs line-clamp-1 text-foreground">{card.name}</p>

                      {card.variant_label ? (
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-primary/10 text-primary font-semibold mt-1 inline-block line-clamp-1">
                          {card.variant_label}
                        </span>
                      ) : (
                        card.rarity && (
                          <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-muted text-muted-foreground mt-1 inline-block">
                            {card.rarity.replace(/_/g, ' ')}
                          </span>
                        )
                      )}

                      {card.set && (
                        <p className="text-[10px] text-muted-foreground line-clamp-1 mt-1 font-mono">
                          {card.set}
                        </p>
                      )}
                    </div>

                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="w-full mt-2 text-xs h-7 group-hover:bg-primary group-hover:text-primary-foreground font-semibold"
                    >
                      <Check className="w-3 h-3 mr-1" /> Use Variant
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">
                  Product Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder="e.g. Blue-Eyes White Dragon"
                  className={cn(errors.name && 'border-destructive')}
                />
                {errors.name && (
                  <p className="text-sm text-destructive">{errors.name}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="slug">
                  Slug <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => handleChange('slug', e.target.value)}
                  placeholder="e.g. blue-eyes-white-dragon"
                  className={cn(errors.slug && 'border-destructive')}
                />
                {errors.slug && (
                  <p className="text-sm text-destructive">{errors.slug}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description || ''}
                  onChange={(e) => handleChange('description', e.target.value)}
                  placeholder="Card effect, text, condition notes, or product description..."
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>

          {/* Image Upload */}
          <Card>
            <CardHeader>
              <CardTitle>Product Image</CardTitle>
            </CardHeader>
            <CardContent>
              <ImageUpload
                label="Card / Product Photo"
                description="Upload high-res card scans directly to Supabase storage or paste an external URL"
                value={formData.image_url || ''}
                onChange={(url) => handleChange('image_url', url)}
              />
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Details */}
          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>
                  Game <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.game}
                  onValueChange={(value) => handleChange('game', value)}
                >
                  <SelectTrigger className={cn(errors.game && 'border-destructive')}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(GAME_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.game && (
                  <p className="text-sm text-destructive">{errors.game}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="set">Set Name / Code</Label>
                <Input
                  id="set"
                  value={formData.set || ''}
                  onChange={(e) => handleChange('set', e.target.value)}
                  placeholder="e.g. Legend of Blue Eyes (LOB-001)"
                />
              </div>

              <div className="space-y-2">
                <Label>Rarity</Label>
                <Select
                  value={formData.rarity || 'COMMON'}
                  onValueChange={(value) => handleChange('rarity', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(RARITY_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Condition</Label>
                <Select
                  value={formData.condition || 'NEAR_MINT'}
                  onValueChange={(value) => handleChange('condition', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(CONDITION_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Pricing & Stock */}
          <Card>
            <CardHeader>
              <CardTitle>Pricing & Stock</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="price">
                  Price (JMD) <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold">
                    $
                  </span>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.price || ''}
                    onChange={(e) => handleChange('price', parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                    className={cn('pl-7', errors.price && 'border-destructive')}
                  />
                </div>
                {errors.price && (
                  <p className="text-sm text-destructive">{errors.price}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="stock">
                  Stock Quantity <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="stock"
                  type="number"
                  min="0"
                  value={formData.stock_quantity ?? ''}
                  onChange={(e) => handleChange('stock_quantity', parseInt(e.target.value) || 0)}
                  placeholder="1"
                  className={cn(errors.stock_quantity && 'border-destructive')}
                />
                {errors.stock_quantity && (
                  <p className="text-sm text-destructive">{errors.stock_quantity}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Options */}
          <Card>
            <CardHeader>
              <CardTitle>Options</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="featured">Featured Product</Label>
                  <p className="text-xs text-muted-foreground">
                    Display in featured section on storefront
                  </p>
                </div>
                <Switch
                  id="featured"
                  checked={formData.is_featured}
                  onCheckedChange={(checked) => handleChange('is_featured', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="sealed">Sealed Product</Label>
                  <p className="text-xs text-muted-foreground">
                    Booster box, tin, or structure deck
                  </p>
                </div>
                <Switch
                  id="sealed"
                  checked={formData.is_sealed}
                  onCheckedChange={(checked) => handleChange('is_sealed', checked)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Submit */}
          <div className="flex gap-4">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => router.back()}
            >
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {isEditing ? 'Save Changes' : 'Create Product'}
            </Button>
          </div>
        </div>
      </div>
    </form>
  )
}
