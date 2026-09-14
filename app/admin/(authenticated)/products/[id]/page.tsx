'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ProductForm } from '@/components/admin/products'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, ArrowLeft, AlertCircle } from 'lucide-react'
import type { Product } from '@/lib/admin/types'

export default function EditProductPage() {
  const params = useParams()
  const productId = Array.isArray(params.id) ? params.id[0] : params.id
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchProduct = async () => {
      if (!productId) return
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(`/api/admin/products/${productId}`)
        if (!res.ok) {
          if (res.status === 404) {
            throw new Error('Product not found in database')
          }
          throw new Error(`Failed to load product (${res.status})`)
        }
        const data = await res.json()
        setProduct(data)
      } catch (err: any) {
        console.error('Failed to fetch product:', err)
        setError(err.message || 'Error loading product')
      } finally {
        setLoading(false)
      }
    }

    fetchProduct()
  }, [productId])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/products">
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Edit Product</h1>
            <p className="text-muted-foreground text-sm mt-0.5">Loading product data...</p>
          </div>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col items-center justify-center py-16 text-center space-y-3">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Fetching card details from Supabase...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/products">
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Product Not Found</h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              {error || 'The requested product does not exist in inventory.'}
            </p>
          </div>
        </div>
        <Card className="border-destructive/20 bg-destructive/5">
          <CardContent className="p-6">
            <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center text-destructive">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-base">Card or Product Missing</h3>
                <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                  This item may have been deleted or the link ID is invalid.
                </p>
              </div>
              <Button asChild>
                <Link href="/admin/products">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Return to Products
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/products">
            <ArrowLeft className="w-4 h-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Edit Product</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Update pricing, condition, card art, and stock levels
          </p>
        </div>
      </div>

      <ProductForm product={product} isEditing />
    </div>
  )
}
