// Script to migrate existing notes from ClientCase.notes to CaseNote table
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function migrateNotes() {
  try {
    console.log('Starting notes migration...')
    
    // Get all client cases that have notes
    const casesWithNotes = await prisma.clientCase.findMany({
      where: {
        notes: {
          not: null,
        },
      },
    })
    
    console.log(`Found ${casesWithNotes.length} cases with notes to migrate`)
    
    let migratedCount = 0
    
    for (const clientCase of casesWithNotes) {
      if (clientCase.notes && clientCase.notes.trim()) {
        // Check if a CaseNote already exists for this case
        const existingNote = await prisma.caseNote.findFirst({
          where: {
            clientCaseId: clientCase.id,
            content: clientCase.notes.trim(),
          },
        })
        
        if (!existingNote) {
          // Create a CaseNote with the original creation date
          await prisma.caseNote.create({
            data: {
              content: clientCase.notes.trim(),
              clientCaseId: clientCase.id,
              createdAt: clientCase.createdAt, // Use the original case creation date
            },
          })
          
          migratedCount++
          console.log(`Migrated note for case ${clientCase.id}: ${clientCase.clientName}`)
        } else {
          console.log(`Note already exists for case ${clientCase.id}: ${clientCase.clientName}`)
        }
      }
    }
    
    console.log(`Migration completed! Migrated ${migratedCount} notes.`)
  } catch (error) {
    console.error('Migration failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

migrateNotes()
