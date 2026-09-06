'use client'

import { useState } from 'react'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { CartSidebar } from '@/components/cart-sidebar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useCart } from '@/components/ui/use-toast'
import { formatPrice, cn } from '@/lib/utils'
import { Truck, MapPin, CreditCard, CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

type FulfillmentType = 'IN_STORE_PICKUP' | 'ISLAND_WIDE_DELIVERY'

export default function CheckoutPage() {
  const { items, totalPrice, clearCart } = useCart()
  const [step, setStep] = useState<'information' | 'fulfillment' | 'payment' | 'complete'>('information')
  const [fulfillmentType, setFulfillmentType] = useState<FulfillmentType>('IN_STORE_PICKUP')
  const [isProcessing, setIsProcessing] = useState(false)
  const [orderId, setOrderId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    parish: '',
    notes: '',
  })

  if (items.length === 0 && step !== 'complete') {
    return (
      <>
        <Header />
        <CartSidebar />
        <main className="min-h-screen py-20">
          <div className="container mx-auto px-4 max-w-2xl text-center">
            <h1 className="text-3xl font-bold mb-4">Your cart is empty</h1>
            <p className="text-muted-foreground mb-6">
              Add some items to your cart before checking out.
            </p>
            <Link href="/shop">
              <Button>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Continue Shopping
              </Button>
            </Link>
          </div>
        </main>
        <Footer />
      </>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsProcessing(true)
    setError(null)

    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: items.map((item) => ({
            product_id: item.product_id,
            quantity: item.quantity,
          })),
          fulfillment_type: fulfillmentType,
          shipping_address: fulfillmentType === 'ISLAND_WIDE_DELIVERY'
            ? `${formData.address}, ${formData.city}, ${formData.parish}`
            : undefined,
          customer_name: formData.name,
          customer_email: formData.email,
          customer_phone: formData.phone,
          notes: formData.notes,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create order')
      }

      const data = await response.json()
      setOrderId(data.id)
      setStep('complete')
      clearCart()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsProcessing(false)
    }
  }

  if (step === 'complete') {
    return (
      <>
        <Header />
        <CartSidebar />
        <main className="min-h-screen py-20">
          <div className="container mx-auto px-4 max-w-2xl text-center">
            <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-10 h-10 text-green-500" />
            </div>
            <h1 className="text-3xl font-bold mb-4">Order Confirmed!</h1>
            <p className="text-muted-foreground mb-2">
              Thank you for your order
            </p>
            <p className="text-sm text-muted-foreground mb-6">
              Order ID: <span className="font-mono font-medium">{orderId}</span>
            </p>
            <p className="mb-6">
              We&apos;ll send a confirmation email to <strong>{formData.email}</strong> shortly.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/shop">
                <Button variant="outline">Continue Shopping</Button>
              </Link>
              <Link href="/events">
                <Button>View Upcoming Events</Button>
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </>
    )
  }

  const steps = [
    { key: 'information', label: 'Information' },
    { key: 'fulfillment', label: 'Fulfillment' },
    { key: 'payment', label: 'Payment' },
  ]

  const currentStepIndex = steps.findIndex((s) => s.key === step)

  return (
    <>
      <Header />
      <CartSidebar />

      <main className="min-h-screen py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <h1 className="text-3xl font-bold mb-8">Checkout</h1>

            {/* Step indicator */}
            <div className="flex items-center mb-8">
              {steps.map((s, i) => (
                <div key={s.key} className="flex items-center flex-1">
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
                    i < currentStepIndex
                      ? "bg-primary text-primary-foreground"
                      : i === currentStepIndex
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  )}>
                    {i + 1}
                  </div>
                  <span className={cn(
                    "ml-2 text-sm",
                    i <= currentStepIndex ? "font-medium" : "text-muted-foreground"
                  )}>
                    {s.label}
                  </span>
                  {i < steps.length - 1 && (
                    <div className={cn(
                      "h-px flex-1 mx-4",
                      i < currentStepIndex ? "bg-primary" : "bg-muted"
                    )} />
                  )}
                </div>
              ))}
            </div>

            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                  {step === 'information' && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Contact Information</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm font-medium mb-2 block">
                              Full Name *
                            </label>
                            <Input
                              required
                              value={formData.name}
                              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                              placeholder="John Doe"
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium mb-2 block">
                              Phone Number
                            </label>
                            <Input
                              type="tel"
                              value={formData.phone}
                              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                              placeholder="(876) 555-1234"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="text-sm font-medium mb-2 block">
                            Email Address *
                          </label>
                          <Input
                            type="email"
                            required
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            placeholder="you@example.com"
                          />
                        </div>
                        <Button
                          type="button"
                          onClick={() => setStep('fulfillment')}
                          className="w-full"
                          size="lg"
                          disabled={!formData.name || !formData.email}
                        >
                          Continue to Fulfillment
                        </Button>
                      </CardContent>
                    </Card>
                  )}

                  {step === 'fulfillment' && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Fulfillment Method</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div
                          className={cn(
                            "p-4 border-2 rounded-lg cursor-pointer transition-all",
                            fulfillmentType === 'IN_STORE_PICKUP'
                              ? "border-primary bg-primary/5"
                              : "border-border hover:border-primary/50"
                          )}
                          onClick={() => setFulfillmentType('IN_STORE_PICKUP')}
                        >
                          <div className="flex items-start gap-3">
                            <MapPin className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                            <div>
                              <h3 className="font-semibold">In-Store Pickup (Free)</h3>
                              <p className="text-sm text-muted-foreground">
                                Pick up your order at our Kingston store
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                123 Half Way Tree Road, Kingston, Jamaica
                              </p>
                            </div>
                          </div>
                        </div>

                        <div
                          className={cn(
                            "p-4 border-2 rounded-lg cursor-pointer transition-all",
                            fulfillmentType === 'ISLAND_WIDE_DELIVERY'
                              ? "border-primary bg-primary/5"
                              : "border-border hover:border-primary/50"
                          )}
                          onClick={() => setFulfillmentType('ISLAND_WIDE_DELIVERY')}
                        >
                          <div className="flex items-start gap-3">
                            <Truck className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                            <div>
                              <h3 className="font-semibold">Island-Wide Delivery</h3>
                              <p className="text-sm text-muted-foreground">
                                Delivery via Knutsford Express
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                2-3 business days
                              </p>
                            </div>
                          </div>
                        </div>

                        {fulfillmentType === 'ISLAND_WIDE_DELIVERY' && (
                          <div className="space-y-4 pt-4 border-t">
                            <h4 className="font-medium">Shipping Address</h4>
                            <div>
                              <label className="text-sm font-medium mb-2 block">
                                Street Address *
                              </label>
                              <Input
                                required={fulfillmentType === 'ISLAND_WIDE_DELIVERY'}
                                value={formData.address}
                                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                placeholder="123 Main Street"
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="text-sm font-medium mb-2 block">
                                  City *
                                </label>
                                <Input
                                  required={fulfillmentType === 'ISLAND_WIDE_DELIVERY'}
                                  value={formData.city}
                                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                  placeholder="Kingston"
                                />
                              </div>
                              <div>
                                <label className="text-sm font-medium mb-2 block">
                                  Parish *
                                </label>
                                <Input
                                  required={fulfillmentType === 'ISLAND_WIDE_DELIVERY'}
                                  value={formData.parish}
                                  onChange={(e) => setFormData({ ...formData, parish: e.target.value })}
                                  placeholder="St. Andrew"
                                />
                              </div>
                            </div>
                          </div>
                        )}

                        <div className="flex gap-4 pt-4">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setStep('information')}
                            className="flex-1"
                            size="lg"
                          >
                            Back
                          </Button>
                          <Button
                            type="button"
                            onClick={() => setStep('payment')}
                            className="flex-1"
                            size="lg"
                            disabled={
                              fulfillmentType === 'ISLAND_WIDE_DELIVERY' &&
                              (!formData.address || !formData.city || !formData.parish)
                            }
                          >
                            Continue to Payment
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {step === 'payment' && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Payment Method</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="p-4 border-2 rounded-lg border-primary bg-primary/5">
                          <div className="flex items-start gap-3">
                            <CreditCard className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                            <div className="flex-1">
                              <h3 className="font-semibold">Pay at Store / Cash on Pickup</h3>
                              <p className="text-sm text-muted-foreground">
                                Pay when you pick up your order in-store
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="p-4 border-2 rounded-lg opacity-60 cursor-not-allowed">
                          <div className="flex items-start gap-3">
                            <CreditCard className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                            <div className="flex-1">
                              <h3 className="font-semibold">WiPay / Stripe (Coming Soon)</h3>
                              <p className="text-sm text-muted-foreground">
                                Online payment integration
                              </p>
                            </div>
                          </div>
                        </div>

                        <div>
                          <label className="text-sm font-medium mb-2 block">
                            Order Notes
                          </label>
                          <Input
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            placeholder="Any special instructions..."
                          />
                        </div>

                        {error && (
                          <div className="flex items-start gap-2 p-3 rounded-md bg-destructive/10 border border-destructive/20">
                            <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-destructive">{error}</p>
                          </div>
                        )}

                        <div className="flex gap-4 pt-4">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setStep('fulfillment')}
                            className="flex-1"
                            size="lg"
                            disabled={isProcessing}
                          >
                            Back
                          </Button>
                          <Button
                            type="submit"
                            className="flex-1"
                            size="lg"
                            disabled={isProcessing}
                          >
                            {isProcessing ? 'Processing...' : 'Place Order'}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>

                {/* Order summary sidebar */}
                <div className="lg:col-span-1">
                  <div className="sticky top-24">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Order Summary</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          {items.map((item) => (
                            <div key={item.product_id} className="flex justify-between text-sm">
                              <span className="line-clamp-1 flex-1">
                                {item.product.name} × {item.quantity}
                              </span>
                              <span className="font-medium ml-2">
                                {formatPrice(item.product.price * item.quantity)}
                              </span>
                            </div>
                          ))}
                        </div>

                        <div className="border-t pt-4 space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Subtotal</span>
                            <span>{formatPrice(totalPrice)}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Shipping</span>
                            <span>
                              {fulfillmentType === 'IN_STORE_PICKUP' ? 'Free' : 'TBD'}
                            </span>
                          </div>
                          <div className="flex justify-between font-bold text-lg pt-2 border-t">
                            <span>Total</span>
                            <span className="text-primary">{formatPrice(totalPrice)}</span>
                          </div>
                        </div>

                        <div className="pt-4 border-t text-xs text-muted-foreground space-y-1">
                          <p>🔒 Your information is secure</p>
                          <p>📦 Sealed products ship with care</p>
                          <p>💬 Questions? Contact us via WhatsApp</p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
      </main>

      <Footer />
    </>
  )
}