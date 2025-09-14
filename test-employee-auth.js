const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

async function testEmployeeAuth() {
  console.log('🧪 Testing Employee Authentication Endpoints\n');

  try {
    // Test 1: Login with non-existent employee
    console.log('1️⃣ Testing login with non-existent employee...');
    try {
      await axios.post(`${BASE_URL}/employee-auth/login`, {
        employeeNumber: 'EMP9999',
        password: 'test123'
      });
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Correctly rejected non-existent employee');
      } else {
        console.log('❌ Unexpected error:', error.response?.data);
      }
    }

    // Test 2: Login with existing employee (first time - no password set)
    console.log('\n2️⃣ Testing first-time login (password setup required)...');
    try {
      const response = await axios.post(`${BASE_URL}/employee-auth/login`, {
        employeeNumber: 'EMP0001', // Assuming this exists
        password: 'anypassword'
      });
      
      if (response.data.requiresPasswordSetup) {
        console.log('✅ First-time login detected correctly');
        console.log('📝 Employee data:', response.data.employee);
        
        // Test 3: Set password
        console.log('\n3️⃣ Testing password setup...');
        const setPasswordResponse = await axios.post(`${BASE_URL}/employee-auth/set-password`, {
          employeeId: response.data.employee.id,
          password: 'newpassword123',
          confirmPassword: 'newpassword123'
        });
        console.log('✅ Password set successfully:', setPasswordResponse.data.message);
        
        // Test 4: Login with new password
        console.log('\n4️⃣ Testing login with new password...');
        const loginResponse = await axios.post(`${BASE_URL}/employee-auth/login`, {
          employeeNumber: 'EMP0001',
          password: 'newpassword123'
        });
        console.log('✅ Login successful with new password');
        console.log('🎫 Token received:', loginResponse.data.token ? 'Yes' : 'No');
        console.log('👤 Employee data:', loginResponse.data.employee);
        
        // Test 5: Get profile (protected route)
        console.log('\n5️⃣ Testing get profile (protected route)...');
        const profileResponse = await axios.get(`${BASE_URL}/employee-auth/profile`, {
          headers: {
            'Authorization': `Bearer ${loginResponse.data.token}`
          }
        });
        console.log('✅ Profile retrieved successfully');
        console.log('📋 Profile data:', profileResponse.data.employee);
        
        // Test 6: Change password
        console.log('\n6️⃣ Testing change password...');
        const changePasswordResponse = await axios.put(`${BASE_URL}/employee-auth/change-password`, {
          currentPassword: 'newpassword123',
          newPassword: 'updatedpassword123',
          confirmPassword: 'updatedpassword123'
        }, {
          headers: {
            'Authorization': `Bearer ${loginResponse.data.token}`
          }
        });
        console.log('✅ Password changed successfully');
        
      } else {
        console.log('ℹ️ Employee already has password set, testing regular login...');
        // Test regular login
        const loginResponse = await axios.post(`${BASE_URL}/employee-auth/login`, {
          employeeNumber: 'EMP0001',
          password: 'test123' // Try common password
        });
        console.log('✅ Regular login successful');
      }
      
    } catch (error) {
      console.log('❌ Error in login flow:', error.response?.data || error.message);
    }

    console.log('\n🎉 Employee authentication testing completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testEmployeeAuth();
