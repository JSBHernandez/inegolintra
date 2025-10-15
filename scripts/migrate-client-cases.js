/**
 * Script para migrar datos de Client Cases y Case Notes desde el archivo SQL de respaldo
 * 
 * Este script:
 * 1. Lee el archivo SQL con los datos antiguos
 * 2. Extrae los datos de client_cases y case_notes
 * 3. Los inserta en la base de datos actual usando Prisma
 * 
 * IMPORTANTE: Revisa los datos antes de ejecutar. Este script NO sobrescribirá datos existentes.
 * 
 * Uso: node scripts/migrate-client-cases.js
 */

const { PrismaClient } = require('@prisma/client')
const fs = require('fs')
const path = require('path')
const readline = require('readline')

const prisma = new PrismaClient()

async function askQuestion(query) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  })

  return new Promise(resolve => rl.question(query, ans => {
    rl.close()
    resolve(ans)
  }))
}

// Función principal de migración
async function migrateData() {
  console.log('🚀 Iniciando migración de Client Cases...\n')
  
  const sqlFilePath = path.join(__dirname, '../temp/u511627749_Inegol.sql')
  
  if (!fs.existsSync(sqlFilePath)) {
    console.error('❌ Error: No se encontró el archivo SQL en temp/u511627749_Inegol.sql')
    console.log('   Por favor, asegúrate de que el archivo esté en la ubicación correcta.')
    return
  }
  
  console.log('📖 Leyendo archivo SQL...')
  const sqlContent = fs.readFileSync(sqlFilePath, 'utf-8')
  
  // Extraer datos de client_cases usando regex
  console.log('🔍 Extrayendo datos de client_cases...')
  const clientCasesMatch = sqlContent.match(/INSERT INTO `client_cases`[^;]+;/gs)
  const clientCasesData = []
  
  if (clientCasesMatch) {
    for (const insert of clientCasesMatch) {
      // Extraer los VALUES
      const valuesMatch = insert.match(/VALUES\s+(.+);/s)
      if (valuesMatch) {
        const valuesString = valuesMatch[1]
        // Dividir por ),( para separar cada fila
        const rows = valuesString.split(/\),\s*\(/g)
        
        for (let row of rows) {
          // Limpiar paréntesis
          row = row.replace(/^\(/, '').replace(/\)$/, '')
          
          // Parsear manualmente cada campo
          const fields = []
          let current = ''
          let inQuote = false
          let escapeNext = false
          
          for (let i = 0; i < row.length; i++) {
            const char = row[i]
            
            if (escapeNext) {
              current += char
              escapeNext = false
              continue
            }
            
            if (char === '\\') {
              escapeNext = true
              current += char
              continue
            }
            
            if (char === "'") {
              inQuote = !inQuote
              continue
            }
            
            if (char === ',' && !inQuote) {
              fields.push(current.trim())
              current = ''
              continue
            }
            
            current += char
          }
          
          // Agregar el último campo
          if (current.trim()) {
            fields.push(current.trim())
          }
          
          if (fields.length >= 9) {
            clientCasesData.push(fields)
          }
        }
      }
    }
  }
  
  // Extraer datos de case_notes usando regex
  console.log('� Extrayendo datos de case_notes...')
  const caseNotesMatch = sqlContent.match(/INSERT INTO `case_notes`[^;]+;/gs)
  const caseNotesData = []
  
  if (caseNotesMatch) {
    for (const insert of caseNotesMatch) {
      const valuesMatch = insert.match(/VALUES\s+(.+);/s)
      if (valuesMatch) {
        const valuesString = valuesMatch[1]
        const rows = valuesString.split(/\),\s*\(/g)
        
        for (let row of rows) {
          row = row.replace(/^\(/, '').replace(/\)$/, '')
          
          const fields = []
          let current = ''
          let inQuote = false
          let escapeNext = false
          
          for (let i = 0; i < row.length; i++) {
            const char = row[i]
            
            if (escapeNext) {
              current += char
              escapeNext = false
              continue
            }
            
            if (char === '\\') {
              escapeNext = true
              current += char
              continue
            }
            
            if (char === "'") {
              inQuote = !inQuote
              continue
            }
            
            if (char === ',' && !inQuote) {
              fields.push(current.trim())
              current = ''
              continue
            }
            
            current += char
          }
          
          if (current.trim()) {
            fields.push(current.trim())
          }
          
          if (fields.length >= 4) {
            caseNotesData.push(fields)
          }
        }
      }
    }
  }
  
  console.log(`\n📊 Datos encontrados:`)
  console.log(`   - Client Cases: ${clientCasesData.length}`)
  console.log(`   - Case Notes: ${caseNotesData.length}\n`)
  
  if (clientCasesData.length === 0 && caseNotesData.length === 0) {
    console.log('❌ No se encontraron datos para migrar.')
    return
  }
  
  // Preguntar confirmación
  console.log('⚠️  ADVERTENCIA: Este script insertará datos en tu base de datos.')
  console.log('   - Los registros existentes NO serán sobrescritos')
  console.log('   - Se recomienda hacer un respaldo antes de continuar\n')
  
  const answer = await askQuestion('¿Deseas continuar? (si/no): ')
  
  if (answer.toLowerCase() !== 'si' && answer.toLowerCase() !== 's' && answer.toLowerCase() !== 'yes') {
    console.log('\n❌ Migración cancelada por el usuario.')
    return
  }
  
  console.log('')
  
  // Migrar Client Cases
  console.log('📝 Migrando Client Cases...')
  let casesInserted = 0
  let casesSkipped = 0
  let casesErrors = 0
  
  for (const caseData of clientCasesData) {
    try {
      const id = parseInt(caseData[0])
      const clientName = caseData[1] || ''
      const caseType = caseData[2] || ''
      const notes = caseData[3] === 'NULL' ? null : caseData[3]
      const totalContract = caseData[4] === 'NULL' ? null : parseFloat(caseData[4])
      const paralegal = caseData[5] === 'NULL' ? null : caseData[5]
      const createdAt = new Date(caseData[6])
      const updatedAt = new Date(caseData[7])
      const status = caseData[8] || 'Active'
      
      // Verificar si el caso ya existe
      const existing = await prisma.clientCase.findUnique({
        where: { id: id }
      })
      
      if (existing) {
        casesSkipped++
        continue
      }
      
      await prisma.clientCase.create({
        data: {
          id,
          clientName,
          caseType,
          notes,
          totalContract,
          paralegal,
          createdAt,
          updatedAt,
          status
        }
      })
      
      casesInserted++
      if (casesInserted % 10 === 0) {
        console.log(`   ✅ ${casesInserted} casos migrados...`)
      }
    } catch (error) {
      console.error(`   ❌ Error migrando caso ID ${caseData[0]}:`, error.message)
      casesErrors++
    }
  }
  
  console.log(`\n✅ Client Cases migrados: ${casesInserted}`)
  console.log(`⏭️  Client Cases saltados (ya existían): ${casesSkipped}`)
  if (casesErrors > 0) {
    console.log(`❌ Client Cases con errores: ${casesErrors}`)
  }
  console.log('')
  
  // Migrar Case Notes
  console.log('📝 Migrando Case Notes...')
  let notesInserted = 0
  let notesSkipped = 0
  let notesErrors = 0
  
  for (const noteData of caseNotesData) {
    try {
      const id = parseInt(noteData[0])
      const content = noteData[1] || ''
      const createdAt = new Date(noteData[2])
      const clientCaseId = parseInt(noteData[3])
      
      // Verificar si la nota ya existe
      const existing = await prisma.caseNote.findUnique({
        where: { id: id }
      })
      
      if (existing) {
        notesSkipped++
        continue
      }
      
      // Verificar que el case existe
      const caseExists = await prisma.clientCase.findUnique({
        where: { id: clientCaseId }
      })
      
      if (!caseExists) {
        console.log(`   ⚠️  Case ID ${clientCaseId} no existe, saltando nota ID ${id}`)
        notesSkipped++
        continue
      }
      
      await prisma.caseNote.create({
        data: {
          id,
          content,
          createdAt,
          clientCaseId
        }
      })
      
      notesInserted++
      if (notesInserted % 50 === 0) {
        console.log(`   ✅ ${notesInserted} notas migradas...`)
      }
    } catch (error) {
      console.error(`   ❌ Error migrando nota ID ${noteData[0]}:`, error.message)
      notesErrors++
    }
  }
  
  console.log(`\n✅ Case Notes migradas: ${notesInserted}`)
  console.log(`⏭️  Case Notes saltadas: ${notesSkipped}`)
  if (notesErrors > 0) {
    console.log(`❌ Case Notes con errores: ${notesErrors}`)
  }
  console.log('')
  
  console.log('🎉 ¡Migración completada!\n')
  console.log('📊 Resumen Final:')
  console.log(`   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
  console.log(`   Client Cases:`)
  console.log(`     ✅ Insertados: ${casesInserted}`)
  console.log(`     ⏭️  Saltados: ${casesSkipped}`)
  if (casesErrors > 0) console.log(`     ❌ Errores: ${casesErrors}`)
  console.log(`   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
  console.log(`   Case Notes:`)
  console.log(`     ✅ Insertadas: ${notesInserted}`)
  console.log(`     ⏭️  Saltadas: ${notesSkipped}`)
  if (notesErrors > 0) console.log(`     ❌ Errores: ${notesErrors}`)
  console.log(`   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`)
}

// Ejecutar la migración
migrateData()
  .catch((error) => {
    console.error('\n❌ Error fatal durante la migración:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
