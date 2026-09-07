'use client'

import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatPrice } from '@/lib/utils'
import { AlertTriangle, ArrowRight, Package } from 'lucide-react'
import { GAME_LABELS, type Product } from '@/lib/admin/types'

interface LowStockAlertProps {
  products: Product[]
  onDismiss?: (productId: string) => void
}

export function LowStockAlert({ products, onDismiss }: LowStockAlertProps) {
  if (products.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-green-500" />
            <CardTitle className="text-lg">Stock Status</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center mb-3">
              <Package className="w-6 h-6 text-green-500" />
            </div>
            <p className="text-sm font-medium">All Products Well Stocked</p>
            <p className="text-xs text-muted-foreground mt-1">
              No products below minimum stock level
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-yellow-500" />
            <CardTitle className="text-lg">Low Stock Alert</CardTitle>
          </div>
          <Badge variant="secondary">{products.length} items</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {products.slice(0, 5).map((product) => (
            <div
              key={product.id}
              className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
            >
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{product.name}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-muted-foreground">
                    {GAME_LABELS[product.game]}
                  </span>
                  {product.set && (
                    <>
                      <span className="text-muted-foreground">•</span>
                      <span className="text-xs text-muted-foreground">
                        {product.set}
                      </span>
                    </>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge
                  variant={product.stock_quantity === 0 ? 'destructive' : 'secondary'}
                  className="font-mono"
                >
                  {product.stock_quantity === 0
                    ? 'Out of Stock'
                    : `${product.stock_quantity} left`}
                </Badge>
                <Link href={`/admin/products/${product.id}`}>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
            </div>
          ))}
          {products.length > 5 && (
            <Link href="/admin/products?filter=low-stock">
              <Button variant="ghost" className="w-full">
                View all {products.length} items
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
