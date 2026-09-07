'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Loader2 } from 'lucide-react'

export default function AdminPage() {
  const router = useRouter()
  const { status } = useSession()

  // Redirect to new dashboard
  useEffect(() => {
    if (status === 'authenticated') {
      router.replace('/admin/dashboard')
    } else if (status === 'unauthenticated') {
      router.replace('/admin/login')
    }
  }, [status, router])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
        <p className="text-muted-foreground">Loading admin panel...</p>
      </div>
    </div>
  )
}
