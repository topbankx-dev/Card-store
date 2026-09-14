'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatPrice } from '@/lib/utils'
import { AlertTriangle, ArrowRight, Package, Edit, Sparkles } from 'lucide-react'
import { GAME_LABELS, type Product } from '@/lib/admin/types'

interface LowStockAlertProps {
  products: Product[]
}

export function LowStockAlert({ products }: LowStockAlertProps) {
  if (!products || products.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-emerald-500" />
            <CardTitle className="text-base font-bold">Inventory Levels</CardTitle>
          </div>
          <CardDescription>Restock alerts & zero-stock tracking</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center mb-3">
              <Package className="w-6 h-6 text-emerald-500" />
            </div>
            <p className="text-sm font-semibold">Inventory Fully Stocked</p>
            <p className="text-xs text-muted-foreground mt-1">
              No single cards or sealed products below minimum threshold.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="flex flex-col justify-between">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            <CardTitle className="text-base font-bold">Low Stock & Restock Alert</CardTitle>
          </div>
          <CardDescription>
            Singles and sealed products requiring restock
          </CardDescription>
        </div>
        <Badge variant="destructive" className="font-mono text-xs">
          {products.length} item{products.length > 1 ? 's' : ''}
        </Badge>
      </CardHeader>

      <CardContent>
        <div className="space-y-3">
          {products.slice(0, 5).map((product) => {
            const isOutOfStock = Number(product.stock_quantity) === 0

            return (
              <div
                key={product.id}
                className="flex items-center justify-between p-3 rounded-xl border bg-card hover:border-primary/50 transition-all gap-3 group"
              >
                {/* Card Thumbnail */}
                <div className="relative w-11 h-14 rounded-md overflow-hidden bg-muted shrink-0 border border-border/60">
                  {product.image_url ? (
                    <Image
                      src={product.image_url}
                      alt={product.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform"
                      sizes="44px"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Sparkles className="w-4 h-4 text-muted-foreground/40" />
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                      {GAME_LABELS[product.game] || product.game}
                    </Badge>
                    {product.rarity && (
                      <span className="text-[10px] text-muted-foreground font-mono truncate">
                        {product.rarity.replace(/_/g, ' ')}
                      </span>
                    )}
                  </div>

                  <Link
                    href={`/admin/products/${product.id}`}
                    className="font-bold text-xs text-foreground group-hover:text-primary transition-colors line-clamp-1"
                  >
                    {product.name}
                  </Link>

                  <p className="text-xs font-mono font-semibold text-primary mt-0.5">
                    {formatPrice(product.price)}
                  </p>
                </div>

                {/* Status & Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <Badge
                    variant={isOutOfStock ? 'destructive' : 'secondary'}
                    className="text-[10px] font-mono"
                  >
                    {isOutOfStock ? '0 in stock' : `${product.stock_quantity} left`}
                  </Badge>

                  <Link href={`/admin/products/${product.id}`}>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary">
                      <Edit className="w-3.5 h-3.5" />
                    </Button>
                  </Link>
                </div>
              </div>
            )
          })}

          {products.length > 5 && (
            <Link href="/admin/products?filter=low-stock" className="block pt-1">
              <Button variant="outline" size="sm" className="w-full text-xs">
                View all {products.length} restock alerts
                <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
              </Button>
            </Link>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
