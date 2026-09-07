'use client'

import * as React from 'react'
import { X, CheckCircle2, XCircle, AlertCircle, Info } from 'lucide-react'
import { cn } from '@/lib/utils'

type ToastVariant = 'default' | 'success' | 'destructive' | 'warning'

type Toast = {
  id: string
  title?: string
  description?: string
  variant: ToastVariant
}

type ToastContext = {
  toast: (props: Omit<Toast, 'id'>) => void
}

const ToastContext = React.createContext<ToastContext | undefined>(undefined)

export function AdminToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([])

  const toast = React.useCallback((props: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substring(7)
    setToasts((prev) => [...prev, { ...props, id }])

    // Auto dismiss after 5 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 5000)
  }, [])

  const dismiss = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {/* Toast Container */}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-md w-full">
        {toasts.map((t) => (
          <ToastItem key={t.id} {...t} onDismiss={() => dismiss(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}

function ToastItem({
  title,
  description,
  variant,
  onDismiss,
}: Toast & { onDismiss: () => void }) {
  const icons = {
    default: null,
    success: <CheckCircle2 className="w-5 h-5 text-green-500" />,
    destructive: <XCircle className="w-5 h-5 text-red-500" />,
    warning: <AlertCircle className="w-5 h-5 text-yellow-500" />,
  }

  return (
    <div
      className={cn(
        'flex items-start gap-3 p-4 rounded-lg border bg-popover shadow-lg animate-in slide-in-from-bottom-2',
        variant === 'destructive' && 'border-red-500/50',
        variant === 'success' && 'border-green-500/50',
        variant === 'warning' && 'border-yellow-500/50'
      )}
    >
      {icons[variant] && <div className="flex-shrink-0">{icons[variant]}</div>}
      <div className="flex-1 min-w-0">
        {title && <p className="text-sm font-medium">{title}</p>}
        {description && (
          <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
        )}
      </div>
      <button
        onClick={onDismiss}
        className="flex-shrink-0 text-muted-foreground hover:text-foreground"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}

export function useAdminToast() {
  const context = React.useContext(ToastContext)
  if (context === undefined) {
    throw new Error('useAdminToast must be used within AdminToastProvider')
  }
  return context
}
