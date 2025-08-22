const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

// Datos de ejemplo para cargar múltiples casos
const sampleCases = [
  {
    clientName: "María García López",
    caseType: "Derecho Civil",
    status: "Active",
    notes: "Caso de divorcio con separación de bienes",
    totalContract: 5000.00
  },
  {
    clientName: "Carlos Rodríguez Martínez",
    caseType: "Derecho Penal",
    status: "Active", 
    notes: "Defensa en caso de tráfico vehicular",
    totalContract: 8500.00
  },
  {
    clientName: "Ana Patricia Fernández",
    caseType: "Derecho Laboral",
    status: "Completed",
    notes: "Demanda por despido injustificado - Caso ganado",
    totalContract: 3200.00
  },
  {
    clientName: "Roberto Silva Castillo",
    caseType: "Derecho Comercial",
    status: "Other",
    notes: "Constitución de sociedad anónima",
    totalContract: null // Sin monto especificado
  },
  {
    clientName: "Isabella Torres Vega",
    caseType: "Derecho de Familia",
    status: "Active",
    notes: "Custodia de menores y pensión alimenticia",
    totalContract: 4500.00
  },
  {
    clientName: "Diego Morales Herrera",
    caseType: "Derecho Inmobiliario",
    status: "Completed",
    notes: "Compraventa de propiedad comercial",
    totalContract: 2800.00
  },
  {
    clientName: "Sofía Ramírez Delgado",
    caseType: "Derecho Tributario",
    status: "Other",
    notes: "Asesoría fiscal para empresa mediana"
    // Sin totalContract - se guardará como null
  }
]

async function loadSampleData() {
  try {
    console.log('🚀 Iniciando carga de datos de muestra...')
    
    // Crear todos los casos de una vez
    const createdCases = await prisma.clientCase.createMany({
      data: sampleCases,
      skipDuplicates: true // Evita errores si hay duplicados
    })

    console.log(`✅ Se crearon exitosamente ${createdCases.count} casos`)

    // Crear notas iniciales para cada caso
    const allCases = await prisma.clientCase.findMany({
      orderBy: { createdAt: 'desc' },
      take: sampleCases.length
    })

    for (const clientCase of allCases) {
      if (clientCase.notes) {
        await prisma.caseNote.create({
          data: {
            content: clientCase.notes,
            clientCaseId: clientCase.id
          }
        })
      }
    }

    console.log('✅ Notas iniciales creadas para todos los casos')
    console.log('📊 Resumen de casos creados:')
    
    const statusCount = await prisma.clientCase.groupBy({
      by: ['status'],
      _count: { status: true }
    })

    statusCount.forEach(group => {
      console.log(`   - ${group.status}: ${group._count.status} casos`)
    })

  } catch (error) {
    console.error('❌ Error al cargar datos:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Función para cargar datos personalizados
async function loadCustomData(customCases) {
  try {
    console.log(`🚀 Cargando ${customCases.length} casos personalizados...`)
    
    const createdCases = await prisma.clientCase.createMany({
      data: customCases,
      skipDuplicates: true
    })

    console.log(`✅ Se crearon exitosamente ${createdCases.count} casos personalizados`)

  } catch (error) {
    console.error('❌ Error al cargar datos personalizados:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Función para limpiar todos los datos (¡CUIDADO!)
async function clearAllData() {
  try {
    console.log('⚠️  ADVERTENCIA: Esto eliminará TODOS los datos existentes')
    
    // Eliminar notas primero (por la relación)
    const deletedNotes = await prisma.caseNote.deleteMany({})
    console.log(`🗑️  Eliminadas ${deletedNotes.count} notas`)
    
    // Luego eliminar casos
    const deletedCases = await prisma.clientCase.deleteMany({})
    console.log(`🗑️  Eliminados ${deletedCases.count} casos`)
    
  } catch (error) {
    console.error('❌ Error al limpiar datos:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Exportar funciones para uso
module.exports = {
  loadSampleData,
  loadCustomData,
  clearAllData,
  sampleCases
}

// Si se ejecuta directamente, cargar datos de muestra
if (require.main === module) {
  const args = process.argv.slice(2)
  
  if (args[0] === '--clear') {
    console.log('⚠️  ¿Estás seguro de que quieres eliminar todos los datos? (y/n)')
    process.stdin.once('data', (data) => {
      if (data.toString().trim().toLowerCase() === 'y') {
        clearAllData()
      } else {
        console.log('❌ Operación cancelada')
        process.exit(0)
      }
    })
  } else {
    loadSampleData()
  }
}
