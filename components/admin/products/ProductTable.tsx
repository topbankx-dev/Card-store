'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { formatPrice } from '@/lib/utils'
import {
  GAME_LABELS,
  RARITY_LABELS,
  CONDITION_LABELS,
  type Product,
} from '@/lib/admin/types'
import {
  MoreHorizontal,
  Edit,
  Trash2,
  Copy,
  Star,
  StarOff,
  Search,
  ImageIcon,
} from 'lucide-react'

interface ProductTableProps {
  products: Product[]
  onDelete?: (id: string) => void
  onBulkDelete?: (ids: string[]) => void
  onToggleFeatured?: (id: string) => void
  selectedIds?: string[]
  onSelectionChange?: (ids: string[]) => void
}

export function ProductTable({
  products,
  onDelete,
  onBulkDelete,
  onToggleFeatured,
  selectedIds = [],
  onSelectionChange,
}: ProductTableProps) {
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.game.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.set?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const allSelected = filteredProducts.length > 0 && filteredProducts.every((p) => selectedIds.includes(p.id))
  const someSelected = filteredProducts.some((p) => selectedIds.includes(p.id))

  const handleSelectAll = () => {
    if (allSelected) {
      onSelectionChange?.(selectedIds.filter((id) => !filteredProducts.find((p) => p.id === id)))
    } else {
      onSelectionChange?.([...new Set([...selectedIds, ...filteredProducts.map((p) => p.id)])])
    }
  }

  const handleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      onSelectionChange?.(selectedIds.filter((i) => i !== id))
    } else {
      onSelectionChange?.([...selectedIds, id])
    }
  }

  const handleCopyId = (id: string) => {
    navigator.clipboard.writeText(id)
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        {selectedIds.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {selectedIds.length} selected
            </span>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => onBulkDelete?.(selectedIds)}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Selected
            </Button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={allSelected}
                  ref={(el) => {
                    if (el) el.checked = allSelected
                  }}
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>
              <TableHead className="w-20">Image</TableHead>
              <TableHead>Product</TableHead>
              <TableHead>Game</TableHead>
              <TableHead>Rarity</TableHead>
              <TableHead>Condition</TableHead>
              <TableHead className="text-right">Price</TableHead>
              <TableHead className="text-center">Stock</TableHead>
              <TableHead className="w-12">Featured</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProducts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                  No products found
                </TableCell>
              </TableRow>
            ) : (
              filteredProducts.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedIds.includes(product.id)}
                      onCheckedChange={() => handleSelect(product.id)}
                    />
                  </TableCell>
                  <TableCell>
                    {product.image_url ? (
                      <div className="w-12 h-12 rounded-md overflow-hidden bg-muted">
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-12 h-12 rounded-md bg-muted flex items-center justify-center">
                        <ImageIcon className="w-6 h-6 text-muted-foreground" />
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="max-w-[200px]">
                      <Link
                        href={`/admin/products/${product.id}`}
                        className="font-medium hover:underline"
                      >
                        {product.name}
                      </Link>
                      {product.set && (
                        <p className="text-xs text-muted-foreground truncate">
                          {product.set}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{GAME_LABELS[product.game]}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        product.rarity === 'SECRET_RARE' || product.rarity === 'MYTHIC'
                          ? 'default'
                          : 'secondary'
                      }
                    >
                      {RARITY_LABELS[product.rarity]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">
                      {CONDITION_LABELS[product.condition]}
                    </span>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatPrice(product.price)}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge
                      variant={
                        product.stock_quantity === 0
                          ? 'destructive'
                          : product.stock_quantity < 5
                          ? 'secondary'
                          : 'outline'
                      }
                    >
                      {product.stock_quantity === 0
                        ? 'Out'
                        : product.stock_quantity}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {product.is_featured && (
                      <Star className="w-4 h-4 text-yellow-500" />
                    )}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/admin/products/${product.id}`}>
                            <Edit className="w-4 h-4 mr-2" />
                            Edit
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onToggleFeatured?.(product.id)}>
                          {product.is_featured ? (
                            <>
                              <StarOff className="w-4 h-4 mr-2" />
                              Remove Featured
                            </>
                          ) : (
                            <>
                              <Star className="w-4 h-4 mr-2" />
                              Add Featured
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleCopyId(product.id)}>
                          <Copy className="w-4 h-4 mr-2" />
                          Copy ID
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => setDeleteId(product.id)}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Product</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this product? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (deleteId) {
                  onDelete?.(deleteId)
                  setDeleteId(null)
                }
              }}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
