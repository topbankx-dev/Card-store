// Script to seed the database with test users
import { PrismaClient, Role } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...\n')

  // Admin user
  const adminEmail = 'admin@tcghub.jm'
  const adminPassword = 'admin123'

  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  })

  if (!existingAdmin) {
    const hashedPassword = await bcrypt.hash(adminPassword, 12)
    const admin = await prisma.user.create({
      data: {
        name: 'Admin',
        email: adminEmail,
        password_hash: hashedPassword,
        role: Role.ADMIN,
        loyalty_points: 0,
      },
    })
    console.log(`✅ Created admin: ${admin.email}`)
    console.log(`   Password: ${adminPassword}`)
  } else {
    console.log(`ℹ️  Admin already exists: ${adminEmail}`)
  }

  // Test player
  const playerEmail = 'player@test.com'
  const playerPassword = 'player123'

  const existingPlayer = await prisma.user.findUnique({
    where: { email: playerEmail },
  })

  if (!existingPlayer) {
    const hashedPassword = await bcrypt.hash(playerPassword, 12)
    const player = await prisma.user.create({
      data: {
        name: 'Test Player',
        email: playerEmail,
        password_hash: hashedPassword,
        role: Role.PLAYER,
        loyalty_points: 100,
      },
    })
    console.log(`✅ Created player: ${player.email}`)
    console.log(`   Password: ${playerPassword}`)
  } else {
    console.log(`ℹ️  Player already exists: ${playerEmail}`)
  }

  console.log('\n✨ Done!')
}

main()
  .catch((e) => {
    console.error('❌ Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
