'use client'

import Link from 'next/link'
import { useState } from 'react'
import { ShoppingCart, Menu, X, Search, User, LogOut, Settings, Shield } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useCart } from '@/components/ui/use-toast'
import { ThemeToggle } from '@/components/theme-toggle'
import { useSession, signOut } from 'next-auth/react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

const shopCategories = [
  { name: 'Yu-Gi-Oh!', href: '/shop?game=YGO' },
  { name: 'One Piece', href: '/shop?game=ONE_PIECE' },
  { name: 'Naruto', href: '/shop?game=NARUTO' },
  { name: 'Magic: The Gathering', href: '/shop?game=MTG' },
  { name: 'Pokemon', href: '/shop?game=POKEMON' },
  { name: 'Accessories', href: '/shop?game=ACCESSORIES' },
  { name: 'Singles', href: '/shop?sealed=false' },
]

export function Header() {
  const { totalItems, openCart } = useCart()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { data: session, status } = useSession()

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-md bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
              <span className="text-white font-bold text-sm">JK</span>
            </div>
            <span className="font-bold text-lg hidden sm:inline">
              Jamaica TCG Hub
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-1">
            {/* Shop Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="text-sm font-medium">
                  Shop
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48">
                {shopCategories.map((category) => (
                  <DropdownMenuItem key={category.name} asChild>
                    <Link href={category.href} className="w-full cursor-pointer">
                      {category.name}
                    </Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <Link href="/events" className="text-sm font-medium hover:text-primary transition-colors px-3 py-2">
              Tournaments
            </Link>
            <Link href="/blog" className="text-sm font-medium hover:text-primary transition-colors px-3 py-2">
              Blog
            </Link>
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="hidden sm:flex">
              <Search className="w-4 h-4" />
            </Button>
            <ThemeToggle />

            {status === 'loading' ? (
              <div className="w-9 h-9 flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : session?.user ? (
              // Logged in - show user dropdown
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="hidden sm:flex relative">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
                      <span className="text-white text-xs font-medium">
                        {session.user.name?.charAt(0).toUpperCase() || 'U'}
                      </span>
                    </div>
                    {session.user.role === 'ADMIN' && (
                      <span className="absolute -top-1 -right-1 w-3 h-3 bg-purple-500 rounded-full border-2 border-background" />
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <div className="px-2 py-1.5">
                    <p className="text-sm font-medium">{session.user.name}</p>
                    <p className="text-xs text-muted-foreground">{session.user.email}</p>
                    {session.user.role === 'ADMIN' && (
                      <p className="text-xs text-purple-500 flex items-center gap-1 mt-1">
                        <Shield className="w-3 h-3" /> Admin
                      </p>
                    )}
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/account">
                      <User className="w-4 h-4 mr-2" />
                      My Account
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/orders">
                      <ShoppingCart className="w-4 h-4 mr-2" />
                      My Orders
                    </Link>
                  </DropdownMenuItem>
                  {session.user.role === 'ADMIN' && (
                    <DropdownMenuItem asChild>
                      <Link href="/admin">
                        <Shield className="w-4 h-4 mr-2" />
                        Admin Dashboard
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-red-500 cursor-pointer"
                    onClick={() => signOut({ callbackUrl: '/' })}
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              // Not logged in - show login button
              <Button variant="ghost" className="hidden sm:flex" asChild>
                <Link href="/login">
                  <User className="w-4 h-4 mr-2" />
                  Sign In
                </Link>
              </Button>
            )}

            <Button
              variant="ghost"
              size="icon"
              onClick={openCart}
              className="relative"
            >
              <ShoppingCart className="w-4 h-4" />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-medium">
                  {totalItems}
                </span>
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="lg:hidden border-t py-4 space-y-1">
            {session?.user ? (
              <>
                <div className="px-4 py-2">
                  <p className="font-medium">{session.user.name}</p>
                  <p className="text-sm text-muted-foreground">{session.user.email}</p>
                </div>
                <div className="border-t my-2" />
                <Link
                  href="/account"
                  className="block px-4 py-2 text-sm font-medium hover:bg-accent rounded-md"
                  onClick={() => setIsMenuOpen(false)}
                >
                  My Account
                </Link>
                <Link
                  href="/orders"
                  className="block px-4 py-2 text-sm font-medium hover:bg-accent rounded-md"
                  onClick={() => setIsMenuOpen(false)}
                >
                  My Orders
                </Link>
                {session.user.role === 'ADMIN' && (
                  <Link
                    href="/admin"
                    className="block px-4 py-2 text-sm font-medium text-purple-500 hover:bg-accent rounded-md"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Admin Dashboard
                  </Link>
                )}
                <button
                  onClick={() => {
                    signOut({ callbackUrl: '/' })
                    setIsMenuOpen(false)
                  }}
                  className="block w-full text-left px-4 py-2 text-sm font-medium text-red-500 hover:bg-accent rounded-md"
                >
                  Sign Out
                </button>
                <div className="border-t my-2" />
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="block px-4 py-2 text-sm font-medium hover:bg-accent rounded-md"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Sign In
                </Link>
                <div className="border-t my-2" />
              </>
            )}
            <div className="px-2 py-2 text-sm font-semibold text-muted-foreground">
              Shop
            </div>
            {shopCategories.map((category) => (
              <Link
                key={category.name}
                href={category.href}
                className="block px-4 py-2 text-sm font-medium hover:bg-accent rounded-md"
                onClick={() => setIsMenuOpen(false)}
              >
                {category.name}
              </Link>
            ))}
            <div className="border-t my-2" />
            <Link
              href="/events"
              className="block px-2 py-2 text-sm font-medium hover:bg-accent rounded-md"
              onClick={() => setIsMenuOpen(false)}
            >
              Tournaments
            </Link>
            <Link
              href="/blog"
              className="block px-2 py-2 text-sm font-medium hover:bg-accent rounded-md"
              onClick={() => setIsMenuOpen(false)}
            >
              Blog
            </Link>
          </div>
        )}
      </div>
    </header>
  )
}