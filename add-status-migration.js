import { db } from './src/lib/db.js'

async function addStatusColumn() {
  try {
    // Try to add the status column
    await db.$executeRaw`ALTER TABLE client_cases ADD COLUMN status VARCHAR(50) DEFAULT 'Active' NOT NULL;`
    
    console.log('✅ Status column added successfully')
    
    // Update any existing records
    await db.$executeRaw`UPDATE client_cases SET status = 'Active' WHERE status IS NULL OR status = '';`
    
    console.log('✅ Existing records updated with Active status')
  } catch (error) {
    if (error instanceof Error && error.message.includes('Duplicate column name')) {
      console.log('ℹ️  Status column already exists')
    } else {
      console.error('❌ Error adding status column:', error)
    }
  } finally {
    await db.$disconnect()
  }
}

addStatusColumn()
