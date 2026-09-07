'use client'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface RevenueChartProps {
  data: { date: string; amount: number; orders: number }[]
  period?: '7d' | '30d' | '90d' | 'year'
  onPeriodChange?: (period: '7d' | '30d' | '90d' | 'year') => void
}

export function RevenueChart({ data, period = '30d', onPeriodChange }: RevenueChartProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-JM', {
      style: 'currency',
      currency: 'JMD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border rounded-lg shadow-lg p-3">
          <p className="text-sm font-medium mb-1">{formatDate(label)}</p>
          <p className="text-sm text-green-600">
            Revenue: {formatCurrency(payload[0]?.value || 0)}
          </p>
          {payload[1] && (
            <p className="text-sm text-muted-foreground">
              Orders: {payload[1]?.value || 0}
            </p>
          )}
        </div>
      )
    }
    return null
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Revenue Overview</CardTitle>
            <CardDescription>Sales performance over time</CardDescription>
          </div>
          {onPeriodChange && (
            <Tabs value={period} onValueChange={(v) => onPeriodChange(v as any)}>
              <TabsList className="h-8">
                <TabsTrigger value="7d" className="text-xs px-2 py-1">7D</TabsTrigger>
                <TabsTrigger value="30d" className="text-xs px-2 py-1">30D</TabsTrigger>
                <TabsTrigger value="90d" className="text-xs px-2 py-1">90D</TabsTrigger>
                <TabsTrigger value="year" className="text-xs px-2 py-1">1Y</TabsTrigger>
              </TabsList>
            </Tabs>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="date"
                tickFormatter={formatDate}
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                className="text-muted-foreground"
              />
              <YAxis
                tickFormatter={formatCurrency}
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                className="text-muted-foreground"
                width={80}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="amount"
                stroke="#22c55e"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorRevenue)"
                name="Revenue"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
