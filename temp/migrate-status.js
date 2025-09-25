const mysql = require('mysql2/promise');
require('dotenv').config();

async function addStatusColumn() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  
  try {
    console.log('Adding status column...');
    
    // Add the status column
    await connection.execute(`
      ALTER TABLE client_cases 
      ADD COLUMN status VARCHAR(50) DEFAULT 'Active' NOT NULL
    `);
    
    console.log('Status column added successfully!');
    
    // Update existing records
    await connection.execute(`
      UPDATE client_cases SET status = 'Active' WHERE status IS NULL
    `);
    
    console.log('Updated existing records with Active status');
    
    // Add index for performance
    await connection.execute(`
      CREATE INDEX idx_client_cases_status ON client_cases(status)
    `);
    
    console.log('Index created successfully!');
    
  } catch (error) {
    if (error.code === 'ER_DUP_FIELDNAME') {
      console.log('Status column already exists!');
    } else if (error.code === 'ER_DUP_KEYNAME') {
      console.log('Index already exists!');
    } else {
      console.error('Error:', error.message);
    }
  } finally {
    await connection.end();
  }
}

addStatusColumn();
