const axios = require('axios');

async function testAPI() {
  try {
    console.log('🧪 Testing API endpoints...\n');
    
    // Test health endpoint
    console.log('1. Testing health endpoint...');
    const healthResponse = await axios.get('http://localhost:5000/api/health');
    console.log('✅ Health check:', healthResponse.data);
    
    // Test academics endpoint
    console.log('\n2. Testing academics endpoint...');
    const collegesResponse = await axios.get('http://localhost:5000/api/academics/colleges');
    console.log(`✅ Colleges: ${collegesResponse.data.length} found`);
    
    if (collegesResponse.data.length > 0) {
      const firstCollege = collegesResponse.data[0];
      console.log(`   First college: ${firstCollege.name} (ID: ${firstCollege.id})`);
      
      // Test departments for first college
      const deptResponse = await axios.get(`http://localhost:5000/api/academics/departments?collegeId=${firstCollege.id}`);
      console.log(`✅ Departments for ${firstCollege.name}: ${deptResponse.data.length} found`);
    }
    
    // Test registration endpoint (without actually registering)
    console.log('\n3. Testing registration validation...');
    try {
      await axios.post('http://localhost:5000/api/auth/register', {
        email: 'test@example.com',
        name: 'Test User',
        password: '123' // Too short, should fail
      });
    } catch (error) {
      if (error.response && error.response.status === 400) {
        console.log('✅ Registration validation working (password too short)');
      } else {
        console.log('❌ Unexpected registration error:', error.message);
      }
    }
    
    console.log('\n🎉 API tests completed!');
    
  } catch (error) {
    console.error('❌ API test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testAPI();