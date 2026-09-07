'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { AdminSidebar, AdminMobileSidebar } from '@/components/admin/layout'
import { AdminHeader } from '@/components/admin/layout'
import { AdminToastProvider } from '@/components/admin/ui/use-admin-toast'
import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const { data: session, status } = useSession()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Check admin access
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/admin/login')
    } else if (status === 'authenticated' && session?.user?.role !== 'ADMIN') {
      router.push('/login?error=AccessDenied')
    }
  }, [status, session, router])

  // Show loading state
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Verifying access...</p>
        </div>
      </div>
    )
  }

  // Don't render if not admin
  if (status === 'authenticated' && session?.user?.role !== 'ADMIN') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Access denied. Admin privileges required.</p>
        </div>
      </div>
    )
  }

  return (
    <AdminToastProvider>
      <div className="min-h-screen bg-background">
        {/* Desktop Sidebar */}
        <div className="hidden md:block">
          <AdminSidebar
            collapsed={sidebarCollapsed}
            onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          />
        </div>

        {/* Mobile Sidebar */}
        <AdminMobileSidebar
          isOpen={mobileMenuOpen}
          onClose={() => setMobileMenuOpen(false)}
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        />

        {/* Main Content */}
        <div
          className={cn(
            'transition-all duration-300',
            sidebarCollapsed ? 'md:pl-16' : 'md:pl-64'
          )}
        >
          <AdminHeader
            onMenuClick={() => setMobileMenuOpen(true)}
          />
          <main className="p-4 md:p-6 lg:p-8">{children}</main>
        </div>
      </div>
    </AdminToastProvider>
  )
}
