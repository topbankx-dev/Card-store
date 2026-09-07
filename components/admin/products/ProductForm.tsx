'use client'

import { useState } from 'react'
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { GAME_LABELS, RARITY_LABELS, CONDITION_LABELS, type Product } from '@/lib/admin/types'
import { cn } from '@/lib/utils'
import { Loader2, Upload, X, ImageIcon } from 'lucide-react'

interface ProductFormProps {
  product?: Partial<Product>
  onSubmit?: (data: Partial<Product>) => Promise<void>
  isEditing?: boolean
}

export function ProductForm({ product, onSubmit, isEditing = false }: ProductFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const [formData, setFormData] = useState<Partial<Product>>({
    name: product?.name || '',
    slug: product?.slug || '',
    game: product?.game || 'YGO',
    set: product?.set || '',
    rarity: product?.rarity || 'COMMON',
    condition: product?.condition || 'NEAR_MINT',
    price: product?.price || 0,
    stock_quantity: product?.stock_quantity || 0,
    image_url: product?.image_url || '',
    description: product?.description || '',
    is_featured: product?.is_featured || false,
    is_sealed: product?.is_sealed || false,
  })

  const handleChange = (field: keyof Product, value: unknown) => {
    setFormData({ ...formData, [field]: value })
    if (errors[field]) {
      setErrors({ ...errors, [field]: '' })
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

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.name?.trim()) {
      newErrors.name = 'Product name is required'
    }
    if (!formData.slug?.trim()) {
      newErrors.slug = 'Slug is required'
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
        // Default behavior - call API
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
          throw new Error('Failed to save product')
        }

        router.push('/admin/products')
        router.refresh()
      }
    } catch (error) {
      console.error('Error saving product:', error)
      setErrors({ submit: 'Failed to save product. Please try again.' })
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
                <p className="text-xs text-muted-foreground">
                  URL-friendly version of the product name
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  placeholder="Product description..."
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>

          {/* Image */}
          <Card>
            <CardHeader>
              <CardTitle>Product Image</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {formData.image_url ? (
                  <div className="relative w-full max-w-md">
                    <img
                      src={formData.image_url}
                      alt={formData.name}
                      className="w-full h-48 object-contain rounded-lg border bg-muted"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute -top-2 -right-2"
                      onClick={() => handleChange('image_url', '')}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="border-2 border-dashed rounded-lg p-8 text-center">
                    <ImageIcon className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <div className="space-y-2">
                      <Input
                        id="image_url"
                        type="url"
                        value={formData.image_url || ''}
                        onChange={(e) => handleChange('image_url', e.target.value)}
                        placeholder="Enter image URL"
                      />
                      <p className="text-xs text-muted-foreground">
                        Or enter a URL to an image hosted elsewhere
                      </p>
                    </div>
                  </div>
                )}
              </div>
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
                <Label htmlFor="set">Set</Label>
                <Input
                  id="set"
                  value={formData.set}
                  onChange={(e) => handleChange('set', e.target.value)}
                  placeholder="e.g. Legend of Blue Eyes"
                />
              </div>

              <div className="space-y-2">
                <Label>Rarity</Label>
                <Select
                  value={formData.rarity}
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
                  value={formData.condition}
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
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
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
                  value={formData.stock_quantity || ''}
                  onChange={(e) => handleChange('stock_quantity', parseInt(e.target.value) || 0)}
                  placeholder="0"
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
                  <Label htmlFor="featured">Featured</Label>
                  <p className="text-sm text-muted-foreground">
                    Show on homepage
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
                  <Label htmlFor="sealed">Sealed</Label>
                  <p className="text-sm text-muted-foreground">
                    Sealed product
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
