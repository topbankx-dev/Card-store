'use client'

import * as React from 'react'

type Theme = 'light' | 'dark'

type ThemeContextType = {
  theme: Theme
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
}

const ThemeContext = React.createContext<ThemeContextType | undefined>(undefined)

const THEME_STORAGE_KEY = 'card-store-theme'

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = React.useState<Theme>('dark')
  const [mounted, setMounted] = React.useState(false)

  // Load theme from localStorage on mount
  React.useEffect(() => {
    try {
      const stored = localStorage.getItem(THEME_STORAGE_KEY) as Theme | null
      if (stored === 'light' || stored === 'dark') {
        setThemeState(stored)
        document.documentElement.classList.toggle('dark', stored === 'dark')
      } else {
        // Default to dark mode — matches the store's dark gamer aesthetic
        setThemeState('dark')
        document.documentElement.classList.add('dark')
        localStorage.setItem(THEME_STORAGE_KEY, 'dark')
      }
    } catch (error) {
      console.error('Error loading theme from localStorage:', error)
    }
    setMounted(true)
  }, [])

  // Apply theme class to <html> element whenever it changes
  React.useEffect(() => {
    if (mounted) {
      document.documentElement.classList.toggle('dark', theme === 'dark')
      try {
        localStorage.setItem(THEME_STORAGE_KEY, theme)
      } catch (error) {
        console.error('Error saving theme to localStorage:', error)
      }
    }
  }, [theme, mounted])

  const setTheme = React.useCallback((newTheme: Theme) => {
    setThemeState(newTheme)
  }, [])

  const toggleTheme = React.useCallback(() => {
    setThemeState((current) => (current === 'light' ? 'dark' : 'light'))
  }, [])

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = React.useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}