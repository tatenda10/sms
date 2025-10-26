const fetch = require('node-fetch');

async function testDirectAPI() {
  console.log('🧪 Testing direct API call to student attendance...');
  
  try {
    const url = 'http://localhost:5000/api/student-attendance/history/TEST123';
    console.log('Calling URL:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token'
      }
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    const responseText = await response.text();
    console.log('Response body (first 200 chars):', responseText.substring(0, 200));
    
    if (responseText.startsWith('<!doctype') || responseText.startsWith('<html')) {
      console.log('❌ Got HTML response instead of JSON - likely a 404 or server error');
    } else {
      console.log('✅ Got non-HTML response');
    }
    
  } catch (error) {
    console.error('❌ Error making API call:', error.message);
  }
}

testDirectAPI();
