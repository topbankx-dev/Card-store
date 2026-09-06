// Script to reset the database - deletes all users but keeps other data
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('⚠️  This will delete ALL users from the database!')
  console.log('')

  // Delete all users (this will cascade to accounts, sessions, orders, etc.)
  const deletedUsers = await prisma.user.deleteMany({})
  console.log(`✅ Deleted ${deletedUsers.count} user(s)`)

  // Optional: Reset auto-increment counters (PostgreSQL doesn't need this)

  console.log('')
  console.log('✨ Database cleaned!')
  console.log('')
  console.log('Run "npm run seed" to create new test users.')
}

main()
  .catch((e) => {
    console.error('❌ Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
