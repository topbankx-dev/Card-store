import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Calendar,
  BarChart3,
  Ticket,
  Settings,
  ScrollText,
  PlusCircle,
  TrendingUp,
  AlertTriangle,
} from 'lucide-react'

export const ADMIN_NAV_ITEMS = [
  {
    title: 'Dashboard',
    href: '/admin/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'Products',
    href: '/admin/products',
    icon: Package,
  },
  {
    title: 'Orders',
    href: '/admin/orders',
    icon: ShoppingCart,
  },
  {
    title: 'Customers',
    href: '/admin/users',
    icon: Users,
  },
  {
    title: 'Events',
    href: '/admin/events',
    icon: Calendar,
  },
  {
    title: 'Analytics',
    href: '/admin/analytics',
    icon: BarChart3,
  },
  {
    title: 'Promo Codes',
    href: '/admin/promos',
    icon: Ticket,
  },
  {
    title: 'Settings',
    href: '/admin/settings',
    icon: Settings,
  },
  {
    title: 'Audit Log',
    href: '/admin/audit-log',
    icon: ScrollText,
  },
] as const

export const LOW_STOCK_THRESHOLD = 5

export const DEFAULT_PAGE_SIZE = 20
export const MAX_PAGE_SIZE = 100

export const DATE_FORMAT = {
  SHORT: 'MMM d, yyyy',
  LONG: 'MMMM d, yyyy',
  TIME: 'h:mm a',
  DATETIME: 'MMM d, yyyy h:mm a',
} as const

export const CURRENCY = 'JMD'
export const CURRENCY_SYMBOL = '$'

export const IMAGE_UPLOAD_CONFIG = {
  maxSize: 5 * 1024 * 1024, // 5MB
  acceptedTypes: ['image/jpeg', 'image/png', 'image/webp'],
  bucket: 'product-images',
}

export const CSV_IMPORT_CONFIG = {
  maxSize: 2 * 1024 * 1024, // 2MB
  acceptedTypes: ['text/csv', 'application/vnd.ms-excel'],
}
