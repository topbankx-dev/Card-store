'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { ADMIN_NAV_ITEMS } from '@/lib/admin/constants'
import {
  ChevronLeft,
  ChevronRight,
  Shield,
  LogOut,
  Menu,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { signOut } from 'next-auth/react'
import { useState } from 'react'

interface AdminSidebarProps {
  collapsed?: boolean
  onToggle?: () => void
}

export function AdminSidebar({ collapsed = false, onToggle }: AdminSidebarProps) {
  const pathname = usePathname()

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/login' })
  }

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          'fixed left-0 top-0 z-40 h-screen border-r bg-card transition-all duration-300 flex flex-col',
          collapsed ? 'w-16' : 'w-64'
        )}
      >
        {/* Header */}
        <div className={cn(
          'flex items-center h-16 border-b px-4',
          collapsed ? 'justify-center' : 'justify-between'
        )}>
          {collapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-600 to-purple-600 flex items-center justify-center">
                  <Shield className="w-4 h-4 text-white" />
                </div>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>Rapid Strike Admin</p>
              </TooltipContent>
            </Tooltip>
          ) : (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-600 to-purple-600 flex items-center justify-center">
                <Shield className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-lg">Admin</span>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
          {ADMIN_NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
            const Icon = item.icon

            const navItem = (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                  collapsed && 'justify-center px-2'
                )}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {!collapsed && <span>{item.title}</span>}
              </Link>
            )

            if (collapsed) {
              return (
                <Tooltip key={item.href}>
                  <TooltipTrigger asChild>
                    {navItem}
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <p>{item.title}</p>
                  </TooltipContent>
                </Tooltip>
              )
            }

            return navItem
          })}
        </nav>

        {/* Footer */}
        <div className="border-t p-2 space-y-1">
          {collapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleSignOut}
                  className="w-full text-destructive hover:bg-destructive/10"
                >
                  <LogOut className="w-5 h-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>Sign Out</p>
              </TooltipContent>
            </Tooltip>
          ) : (
            <Button
              variant="ghost"
              onClick={handleSignOut}
              className="w-full justify-start text-destructive hover:bg-destructive/10"
            >
              <LogOut className="w-5 h-5 mr-3" />
              Sign Out
            </Button>
          )}

          <Button
            variant="ghost"
            size="icon"
            onClick={onToggle}
            className={cn(
              'w-full h-10',
              !collapsed && 'justify-end pr-3'
            )}
          >
            {collapsed ? (
              <ChevronRight className="w-5 h-5" />
            ) : (
              <>
                <ChevronLeft className="w-5 h-5 mr-2" />
                <span className="text-sm">Collapse</span>
              </>
            )}
          </Button>
        </div>
      </aside>
    </TooltipProvider>
  )
}

// Mobile sidebar overlay
export function AdminMobileSidebar({
  isOpen,
  onClose,
  collapsed = false,
  onToggle,
}: {
  isOpen: boolean
  onClose: () => void
  collapsed?: boolean
  onToggle?: () => void
}) {
  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-72 bg-card border-r transform transition-transform duration-300 md:hidden',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex items-center justify-between h-16 px-4 border-b">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-600 to-purple-600 flex items-center justify-center">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-lg">Admin Panel</span>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <Menu className="w-5 h-5" />
          </Button>
        </div>
        <AdminSidebar collapsed={collapsed} onToggle={onToggle} />
      </div>
    </>
  )
}
