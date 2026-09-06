'use client'

import * as React from 'react'

type CartItem = {
  product_id: string
  product: {
    id: string
    name: string
    slug: string
    image_url: string | null
    price: number
    game: string
    rarity?: string | null
  }
  quantity: number
}

type CartContext = {
  items: CartItem[]
  addItem: (item: Omit<CartItem, 'quantity'>, quantity?: number) => void
  removeItem: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
  totalItems: number
  totalPrice: number
  isOpen: boolean
  openCart: () => void
  closeCart: () => void
}

const CartContext = React.createContext<CartContext | undefined>(undefined)

const CART_STORAGE_KEY = 'card-store-cart'

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = React.useState<CartItem[]>([])
  const [isOpen, setIsOpen] = React.useState(false)
  const [isHydrated, setIsHydrated] = React.useState(false)

  // Load cart from localStorage on mount
  React.useEffect(() => {
    try {
      const stored = localStorage.getItem(CART_STORAGE_KEY)
      if (stored) {
        setItems(JSON.parse(stored))
      }
    } catch (error) {
      console.error('Error loading cart from localStorage:', error)
    }
    setIsHydrated(true)
  }, [])

  // Persist cart to localStorage on changes
  React.useEffect(() => {
    if (isHydrated) {
      try {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items))
      } catch (error) {
        console.error('Error saving cart to localStorage:', error)
      }
    }
  }, [items, isHydrated])

  const addItem = React.useCallback(
    (item: Omit<CartItem, 'quantity'>, quantity = 1) => {
      setItems((current) => {
        const existing = current.find((c) => c.product_id === item.product_id)
        if (existing) {
          return current.map((c) =>
            c.product_id === item.product_id
              ? { ...c, quantity: c.quantity + quantity }
              : c
          )
        }
        return [...current, { ...item, quantity }]
      })
    },
    []
  )

  const removeItem = React.useCallback((productId: string) => {
    setItems((current) => current.filter((c) => c.product_id !== productId))
  }, [])

  const updateQuantity = React.useCallback(
    (productId: string, quantity: number) => {
      if (quantity <= 0) {
        removeItem(productId)
        return
      }
      setItems((current) =>
        current.map((c) =>
          c.product_id === productId ? { ...c, quantity } : c
        )
      )
    },
    [removeItem]
  )

  const clearCart = React.useCallback(() => {
    setItems([])
  }, [])

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0)
  const totalPrice = items.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  )

  const openCart = React.useCallback(() => setIsOpen(true), [])
  const closeCart = React.useCallback(() => setIsOpen(false), [])

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        totalItems,
        totalPrice,
        isOpen,
        openCart,
        closeCart,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = React.useContext(CartContext)
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}