'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import {
  Search,
  Package,
  Users,
  Calendar,
  ShoppingCart,
  Loader2,
  X,
} from 'lucide-react'

interface SearchResult {
  type: 'product' | 'user' | 'event' | 'order'
  id: string
  title: string
  subtitle: string
  href: string
}

const typeIcons = {
  product: Package,
  user: Users,
  event: Calendar,
  order: ShoppingCart,
}

const typeColors = {
  product: 'text-blue-500 bg-blue-500/10',
  user: 'text-purple-500 bg-purple-500/10',
  event: 'text-green-500 bg-green-500/10',
  order: 'text-orange-500 bg-orange-500/10',
}

export function GlobalSearch() {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Debounced search
  useEffect(() => {
    if (query.length < 2) {
      setResults([])
      return
    }

    const timer = setTimeout(async () => {
      setIsLoading(true)
      try {
        const res = await fetch(`/api/admin/search?q=${encodeURIComponent(query)}&limit=8`)
        const data = await res.json()
        setResults(data.results || [])
        setSelectedIndex(0)
      } catch (error) {
        console.error('Search error:', error)
        setResults([])
      } finally {
        setIsLoading(false)
      }
    }, 200)

    return () => clearTimeout(timer)
  }, [query])

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!isOpen || results.length === 0) return

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          setSelectedIndex((prev) => (prev + 1) % results.length)
          break
        case 'ArrowUp':
          e.preventDefault()
          setSelectedIndex((prev) => (prev - 1 + results.length) % results.length)
          break
        case 'Enter':
          e.preventDefault()
          if (results[selectedIndex]) {
            router.push(results[selectedIndex].href)
            setIsOpen(false)
            setQuery('')
          }
          break
        case 'Escape':
          setIsOpen(false)
          inputRef.current?.blur()
          break
      }
    },
    [isOpen, results, selectedIndex, router]
  )

  const handleSelect = (result: SearchResult) => {
    router.push(result.href)
    setIsOpen(false)
    setQuery('')
  }

  const clearSearch = () => {
    setQuery('')
    setResults([])
    inputRef.current?.focus()
  }

  return (
    <div ref={containerRef} className="relative w-full max-w-md">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          type="text"
          placeholder="Search products, customers, orders..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          className={cn(
            'pl-9 pr-9 h-9 bg-muted/50 border-transparent focus:bg-background focus:border-input',
            isOpen && query.length > 0 && 'rounded-b-none'
          )}
        />
        {query && (
          <button
            onClick={clearSearch}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <X className="w-4 h-4" />
            )}
          </button>
        )}
      </div>

      {/* Search Results Dropdown */}
      {isOpen && query.length >= 2 && (
        <div className="absolute top-full left-0 right-0 z-50 bg-popover border rounded-b-md shadow-lg overflow-hidden max-h-[400px] overflow-y-auto">
          {results.length > 0 ? (
            <>
              <div className="px-3 py-2 text-xs font-medium text-muted-foreground border-b">
                {results.length} result{results.length !== 1 ? 's' : ''} found
              </div>
              {results.map((result, index) => {
                const Icon = typeIcons[result.type]
                return (
                  <button
                    key={`${result.type}-${result.id}`}
                    onClick={() => handleSelect(result)}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-accent transition-colors',
                      index === selectedIndex && 'bg-accent'
                    )}
                  >
                    <div
                      className={cn(
                        'w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0',
                        typeColors[result.type]
                      )}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{result.title}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {result.subtitle}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground capitalize">
                      {result.type}
                    </span>
                  </button>
                )
              })}
              <div className="px-3 py-2 text-xs text-muted-foreground border-t bg-muted/50">
                <span className="hidden sm:inline">Use</span>
                <kbd className="mx-1 px-1.5 py-0.5 bg-muted rounded text-xs">↑↓</kbd>
                <span>to navigate,</span>
                <kbd className="mx-1 px-1.5 py-0.5 bg-muted rounded text-xs">Enter</kbd>
                <span className="hidden sm:inline">to select</span>
              </div>
            </>
          ) : !isLoading ? (
            <div className="px-3 py-8 text-center">
              <Search className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                No results found for &quot;{query}&quot;
              </p>
            </div>
          ) : null}
        </div>
      )}
    </div>
  )
}
