const { PrismaClient } = require('@prisma/client')

const db = new PrismaClient()

const existingParalegals = [
  'Tania Estrada',
  'Katherine Pineda', 
  'Maria Jovanovic',
  'Herminio Garza'
]

async function seedParalegals() {
  console.log('Seeding paralegals...')
  
  try {
    for (const name of existingParalegals) {
      const existing = await db.paralegal.findFirst({
        where: { name }
      })
      
      if (!existing) {
        await db.paralegal.create({
          data: {
            name,
            isActive: true
          }
        })
        console.log(`✓ Added paralegal: ${name}`)
      } else {
        console.log(`- Already exists: ${name}`)
      }
    }
    
    console.log('✅ Paralegal seeding completed!')
  } catch (error) {
    console.error('❌ Error seeding paralegals:', error)
  } finally {
    await db.$disconnect()
  }
}

seedParalegals()