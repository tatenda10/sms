const { pool } = require('./config/database');

async function testForeignKeys() {
  try {
    console.log('🔍 Testing Sports Foreign Key Relationships...');
    
    // Test 1: Check if students table has RegNumber column
    console.log('\n1️⃣ Checking students table structure...');
    const [studentColumns] = await pool.execute(`
      SELECT COLUMN_NAME, COLUMN_KEY 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'students' 
      AND COLUMN_NAME IN ('id', 'RegNumber', 'student_id')
    `);
    
    console.log('Students table columns:', studentColumns);
    
    // Test 2: Check if employees table has id column
    console.log('\n2️⃣ Checking employees table structure...');
    const [employeeColumns] = await pool.execute(`
      SELECT COLUMN_NAME, COLUMN_KEY 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'employees' 
      AND COLUMN_NAME IN ('id', 'employee_id')
    `);
    
    console.log('Employees table columns:', employeeColumns);
    
    // Test 3: Check if sports_participants table exists and its structure
    console.log('\n3️⃣ Checking sports_participants table structure...');
    const [participantColumns] = await pool.execute(`
      SELECT COLUMN_NAME, COLUMN_KEY, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME
      FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'sports_participants'
      AND REFERENCED_TABLE_NAME IS NOT NULL
    `);
    
    console.log('Sports participants foreign keys:', participantColumns);
    
    // Test 4: Try to get a sample student RegNumber
    console.log('\n4️⃣ Getting sample student data...');
    const [students] = await pool.execute('SELECT RegNumber, Name, Surname FROM students LIMIT 3');
    console.log('Sample students:', students);
    
    // Test 5: Try to get a sample employee id
    console.log('\n5️⃣ Getting sample employee data...');
    const [employees] = await pool.execute('SELECT id, full_name FROM employees LIMIT 3');
    console.log('Sample employees:', employees);
    
    console.log('\n✅ Foreign key test completed successfully!');
    
  } catch (error) {
    console.error('❌ Foreign key test failed:', error);
  } finally {
    await pool.end();
    console.log('🔌 Database connection closed');
  }
}

// Run the test
testForeignKeys();
