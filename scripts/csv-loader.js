const fs = require('fs')
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

// Función para cargar casos desde CSV
async function loadFromCSV(filePath) {
  try {
    console.log(`📁 Leyendo archivo: ${filePath}`)
    
    if (!fs.existsSync(filePath)) {
      console.error(`❌ El archivo ${filePath} no existe`)
      return
    }

    const csvContent = fs.readFileSync(filePath, 'utf-8')
    const lines = csvContent.split('\n').filter(line => line.trim())
    
    if (lines.length <= 1) {
      console.error('❌ El archivo CSV debe tener al menos una fila de datos además del header')
      return
    }

    // Detectar separador (coma o punto y coma)
    const separator = lines[0].includes(';') ? ';' : ','
    console.log(`🔍 Separador detectado: "${separator}"`)

    // Asumir que la primera línea es el header
    const headers = lines[0].split(separator).map(h => h.trim())
    console.log('📋 Headers detectados:', headers)

    const cases = []
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(separator).map(v => v.trim().replace(/"/g, ''))
      
      if (values.length >= 3) { // Al menos clientName, caseType, status
        const caseData = {
          clientName: values[0] || '',
          caseType: values[1] || '',
          status: values[2] || 'Active',
          notes: values[3] || '',
          totalContract: values[4] && values[4] !== '' ? parseFloat(values[4]) : null,
          paralegal: values[5] || null
        }

        if (caseData.clientName && caseData.caseType) {
          cases.push(caseData)
        }
      }
    }

    if (cases.length === 0) {
      console.error('❌ No se encontraron casos válidos en el archivo')
      return
    }

    console.log(`🚀 Cargando ${cases.length} casos desde CSV...`)
    
    const createdCases = await prisma.clientCase.createMany({
      data: cases,
      skipDuplicates: true
    })

    console.log(`✅ Se crearon exitosamente ${createdCases.count} casos`)

    // Crear notas para casos que las tengan
    const allCases = await prisma.clientCase.findMany({
      orderBy: { createdAt: 'desc' },
      take: cases.length
    })

    let notesCreated = 0
    for (const clientCase of allCases) {
      if (clientCase.notes && clientCase.notes.trim()) {
        await prisma.caseNote.create({
          data: {
            content: clientCase.notes,
            clientCaseId: clientCase.id
          }
        })
        notesCreated++
      }
    }

    console.log(`✅ Se crearon ${notesCreated} notas iniciales`)

  } catch (error) {
    console.error('❌ Error al procesar CSV:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Crear archivo CSV de ejemplo
function createSampleCSV() {
  const sampleCSV = `clientName,caseType,status,notes,totalContract,paralegal
"Juan Pérez González","Derecho Civil","Active","Divorcio con acuerdo mutuo",3500.00,"Tania Estrada"
"Laura Martínez Silva","Derecho Penal","Active","Defensa por delito menor",5000.00,"Katherine Pineda"
"Miguel Torres Ruiz","Derecho Laboral","Completed","Demanda laboral resuelta",2800.00,"Maria Jovanovic"
"Carmen López Díaz","Derecho Comercial","Other","Constitución de empresa",,"Herminio Garza"
"Fernando García Vega","Derecho de Familia","Active","Custodia de menores",4200.50,`

  fs.writeFileSync('sample-cases.csv', sampleCSV)
  console.log('📄 Archivo sample-cases.csv creado con datos de ejemplo')
  console.log('📝 Formato esperado: clientName,caseType,status,notes,totalContract,paralegal')
}

module.exports = {
  loadFromCSV,
  createSampleCSV
}

// Si se ejecuta directamente
if (require.main === module) {
  const args = process.argv.slice(2)
  
  if (args[0] === '--create-sample') {
    createSampleCSV()
  } else if (args[0] && args[0].endsWith('.csv')) {
    loadFromCSV(args[0])
  } else {
    console.log('📖 Uso:')
    console.log('  node scripts/csv-loader.js --create-sample    # Crear archivo CSV de ejemplo')
    console.log('  node scripts/csv-loader.js archivo.csv        # Cargar desde archivo CSV')
  }
}
