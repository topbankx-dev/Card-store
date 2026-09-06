import { handlers } from '@/auth'

// Force Node.js runtime for Prisma adapter compatibility
export const runtime = 'nodejs'

export const { GET, POST } = handlers
