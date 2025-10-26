const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

// Test data
const testData = {
  student_reg_number: 'R12345',
  gradelevel_class_id: 1,
  test_name: 'Mathematics Quiz 1',
  test_type: 'quiz',
  marks_obtained: 18,
  total_marks: 20,
  test_date: '2024-01-15',
  academic_year: '2024',
  term: '1',
  comments: 'Good performance on algebra questions'
};

async function testTestMarksAPI() {
  try {
    console.log('🧪 Testing Test Marks API...\n');

    // Test 1: Add a single test mark
    console.log('1️⃣ Testing add single test mark...');
    try {
      const response = await axios.post(`${BASE_URL}/employee-test-marks`, testData, {
        headers: {
          'Authorization': 'Bearer YOUR_EMPLOYEE_TOKEN_HERE',
          'Content-Type': 'application/json'
        }
      });
      console.log('✅ Add test mark successful:', response.data);
    } catch (error) {
      console.log('❌ Add test mark failed:', error.response?.data || error.message);
    }

    // Test 2: Bulk add test marks
    console.log('\n2️⃣ Testing bulk add test marks...');
    const bulkData = {
      test_marks: [
        {
          ...testData,
          student_reg_number: 'R12346',
          test_name: 'Mathematics Quiz 2'
        },
        {
          ...testData,
          student_reg_number: 'R12347',
          test_name: 'Mathematics Quiz 3'
        }
      ]
    };

    try {
      const response = await axios.post(`${BASE_URL}/employee-test-marks/bulk`, bulkData, {
        headers: {
          'Authorization': 'Bearer YOUR_EMPLOYEE_TOKEN_HERE',
          'Content-Type': 'application/json'
        }
      });
      console.log('✅ Bulk add test marks successful:', response.data);
    } catch (error) {
      console.log('❌ Bulk add test marks failed:', error.response?.data || error.message);
    }

    // Test 3: Get test marks by student
    console.log('\n3️⃣ Testing get test marks by student...');
    try {
      const response = await axios.get(`${BASE_URL}/employee-test-marks/student/R12345`, {
        headers: {
          'Authorization': 'Bearer YOUR_EMPLOYEE_TOKEN_HERE'
        }
      });
      console.log('✅ Get test marks by student successful:', response.data);
    } catch (error) {
      console.log('❌ Get test marks by student failed:', error.response?.data || error.message);
    }

    // Test 4: Get test marks by class
    console.log('\n4️⃣ Testing get test marks by class...');
    try {
      const response = await axios.get(`${BASE_URL}/employee-test-marks/class/1`, {
        headers: {
          'Authorization': 'Bearer YOUR_EMPLOYEE_TOKEN_HERE'
        }
      });
      console.log('✅ Get test marks by class successful:', response.data);
    } catch (error) {
      console.log('❌ Get test marks by class failed:', error.response?.data || error.message);
    }

    // Test 5: Get test marks statistics
    console.log('\n5️⃣ Testing get test marks statistics...');
    try {
      const response = await axios.get(`${BASE_URL}/employee-test-marks/statistics/1`, {
        headers: {
          'Authorization': 'Bearer YOUR_EMPLOYEE_TOKEN_HERE'
        }
      });
      console.log('✅ Get test marks statistics successful:', response.data);
    } catch (error) {
      console.log('❌ Get test marks statistics failed:', error.response?.data || error.message);
    }

    console.log('\n🎉 Test Marks API testing completed!');
    console.log('\n📝 Note: Replace YOUR_EMPLOYEE_TOKEN_HERE with a valid employee JWT token');
    console.log('📝 Make sure the database migration has been run');
    console.log('📝 Ensure the server is running on port 5000');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the tests
testTestMarksAPI();
