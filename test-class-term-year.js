const { pool } = require('./config/database');

async function testClassTermYear() {
  try {
    console.log('Testing Class Term Year functionality...');
    
    // Test database connection
    const connection = await pool.getConnection();
    console.log('✅ Database connected successfully');
    
    // Check if class_term_year table exists
    const [tables] = await connection.execute("SHOW TABLES LIKE 'class_term_year'");
    if (tables.length === 0) {
      console.log('❌ class_term_year table does not exist!');
      console.log('Available tables:');
      const [allTables] = await connection.execute('SHOW TABLES');
      allTables.forEach(table => {
        console.log('  -', Object.values(table)[0]);
      });
    } else {
      console.log('✅ class_term_year table exists');
      
      // Check table structure
      const [columns] = await connection.execute('DESCRIBE class_term_year');
      console.log('Table structure:');
      columns.forEach(col => {
        console.log(`  - ${col.Field}: ${col.Type} ${col.Null === 'YES' ? 'NULL' : 'NOT NULL'}`);
      });
    }
    
    // Check if gradelevel_classes table exists
    const [gradelevelTables] = await connection.execute("SHOW TABLES LIKE 'gradelevel_classes'");
    if (gradelevelTables.length === 0) {
      console.log('❌ gradelevel_classes table does not exist!');
    } else {
      console.log('✅ gradelevel_classes table exists');
      
      // Check if there are any classes
      const [classes] = await connection.execute('SELECT COUNT(*) as count FROM gradelevel_classes WHERE is_active = TRUE');
      console.log(`Found ${classes[0].count} active classes`);
    }
    
    // Check if stream table exists
    const [streamTables] = await connection.execute("SHOW TABLES LIKE 'stream'");
    if (streamTables.length === 0) {
      console.log('❌ stream table does not exist!');
    } else {
      console.log('✅ stream table exists');
    }
    
    // Test a simple query
    try {
      const [records] = await connection.execute(`
        SELECT cty.*, 
               gc.name as class_name,
               s.name as stream_name
        FROM class_term_year cty
        LEFT JOIN gradelevel_classes gc ON cty.gradelevel_class_id = gc.id
        LEFT JOIN stream s ON gc.stream_id = s.id
        ORDER BY cty.academic_year DESC, cty.term, s.name, gc.name
      `);
      console.log(`✅ Query executed successfully. Found ${records.length} records`);
    } catch (queryError) {
      console.log('❌ Query failed:', queryError.message);
    }
    
    connection.release();
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Error details:', error);
  }
}

testClassTermYear();
