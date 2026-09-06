import path from 'node:path'

// PrismaConfig type omitted — not yet stable in Prisma 8 RC
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const config: any = {
  schema: path.join(__dirname, 'schema.prisma'),
  url: process.env.DATABASE_URL
}

export default config
