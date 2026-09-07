'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { ProductForm } from '@/components/admin/products'
import { Card, CardContent } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'
import type { Product } from '@/lib/admin/types'

// Sample product for demonstration
const sampleProduct: Product = {
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
}

export default function EditProductPage() {
  const params = useParams()
  const [product, setProduct] = useState<Partial<Product> | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        // In production, fetch from /api/admin/products/[id]
        await new Promise(resolve => setTimeout(resolve, 500))
        setProduct(sampleProduct)
      } catch (error) {
        console.error('Failed to fetch product:', error)
      } finally {
        setLoading(false)
      }
    }

    if (params.id) {
      fetchProduct()
    }
  }, [params.id])

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Edit Product</h1>
          <p className="text-muted-foreground mt-1">Loading product...</p>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Product Not Found</h1>
          <p className="text-muted-foreground mt-1">
            The product you are looking for does not exist.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Edit Product</h1>
        <p className="text-muted-foreground mt-1">
          Update product information
        </p>
      </div>

      <ProductForm product={product} isEditing />
    </div>
  )
}
