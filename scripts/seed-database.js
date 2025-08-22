import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  try {
    console.log('🚀 Iniciando creación de datos...')
    
    // Crear usuario administrador inicial
    console.log('📝 Creando usuario administrador...')
    const hashedPassword = await bcrypt.hash('#BarbaInegol2025', 10)
    
    const adminUser = await prisma.user.upsert({
      where: { email: 'admin@inegolintra.com' },
      update: {},
      create: {
        email: 'admin@inegolintra.com',
        password: hashedPassword,
        name: 'Administrator',
        position: 'System Administrator',
        role: 'ADMIN',
        isActive: true,
        mustChangePassword: false,
      },
    })

    console.log('✅ Usuario administrador creado:', {
      id: adminUser.id,
      email: adminUser.email,
      name: adminUser.name,
      role: adminUser.role
    })

    // Crear algunos datos de ejemplo
    console.log('✅ Datos iniciales creados exitosamente')
    
  } catch (error) {
    console.error('❌ Error creando datos iniciales:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

main()
  .catch((e) => {
    console.error('💥 Error en main:', e)
    process.exit(1)
  })
