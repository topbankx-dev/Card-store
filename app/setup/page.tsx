import { prisma } from '@/lib/prisma'
import { SetupForm } from './setup-form'
import type { Role } from '@prisma/client'

export const dynamic = 'force-dynamic'

export default async function SetupPage() {
  // Check database status
  let dbStatus = 'unknown'
  let userCount = 0

  try {
    userCount = await prisma.user.count()
    dbStatus = 'connected'
  } catch {
    dbStatus = 'disconnected'
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900/20 via-background to-blue-900/20 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">🔧 Database Setup</h1>
          <p className="text-muted-foreground">
            Create your first admin or player account
          </p>
        </div>

        <div className="mb-6 p-4 rounded-lg bg-muted/50 border">
          <h2 className="font-semibold mb-2">Database Status</h2>
          <p className={`text-sm ${dbStatus === 'connected' ? 'text-green-500' : 'text-red-500'}`}>
            • Status: {dbStatus === 'connected' ? '✅ Connected' : '❌ Disconnected'}
          </p>
          <p className="text-sm text-muted-foreground">
            • Users in database: {userCount}
          </p>
        </div>

        <SetupForm />
      </div>
    </div>
  )
}
