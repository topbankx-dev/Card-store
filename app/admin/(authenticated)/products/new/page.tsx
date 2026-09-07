import { ProductForm } from '@/components/admin/products'

export default function NewProductPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Add New Product</h1>
        <p className="text-muted-foreground mt-1">
          Create a new product in your inventory
        </p>
      </div>

      <ProductForm />
    </div>
  )
}
