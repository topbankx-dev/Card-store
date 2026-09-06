import path from 'node:path'
import type { PrismaConfig } from 'prisma'

export default {
  schema: path.join(__dirname, 'schema.prisma'),
  url: env('DATABASE_URL')
} satisfies PrismaConfig
