const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const p = await prisma.project.upsert({
    where: { slug: 'bazzar-certs' },
    update: {},
    create: {
      name: 'Bazzar Certs',
      slug: 'bazzar-certs',
      emoji: '🛡️',
      color: '#BFF128',
      status: 'active',
      progress: 100,
      description: 'iOS Certificates store'
    }
  })
  console.log('Project added:', p)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
