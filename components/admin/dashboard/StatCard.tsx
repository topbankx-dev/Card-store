'use client'

import { cn } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import { LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface StatCardProps {
  title: string
  value: string | number
  icon: LucideIcon
  description?: string
  trend?: {
    value: number
    label?: string
  }
  variant?: 'default' | 'success' | 'warning' | 'danger'
  className?: string
  onClick?: () => void
}

export function StatCard({
  title,
  value,
  icon: Icon,
  description,
  trend,
  variant = 'default',
  className,
  onClick,
}: StatCardProps) {
  const variantStyles = {
    default: 'text-primary',
    success: 'text-green-600 dark:text-green-400',
    warning: 'text-yellow-600 dark:text-yellow-400',
    danger: 'text-red-600 dark:text-red-400',
  }

  const trendIsPositive = trend && trend.value >= 0
  const TrendIcon = trend
    ? trendIsPositive
      ? TrendingUp
      : TrendingDown
    : null

  return (
    <Card
      className={cn(
        'transition-colors',
        onClick && 'cursor-pointer hover:bg-accent/50',
        className
      )}
      onClick={onClick}
    >
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold tracking-tight">{value}</p>
            {description && (
              <p className="text-xs text-muted-foreground">{description}</p>
            )}
            {trend && TrendIcon && (
              <div className="flex items-center gap-1 text-sm">
                <TrendIcon
                  className={cn(
                    'w-4 h-4',
                    trendIsPositive ? 'text-green-500' : 'text-red-500'
                  )}
                />
                <span
                  className={cn(
                    'font-medium',
                    trendIsPositive ? 'text-green-500' : 'text-red-500'
                  )}
                >
                  {trendIsPositive ? '+' : ''}
                  {trend.value}%
                </span>
                {trend.label && (
                  <span className="text-muted-foreground">{trend.label}</span>
                )}
              </div>
            )}
          </div>
          <div
            className={cn(
              'w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center',
              variantStyles[variant]
            )}
          >
            <Icon className="w-6 h-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
