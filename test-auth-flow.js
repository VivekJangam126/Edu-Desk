const axios = require('axios');

async function testAuthFlow() {
  try {
    console.log('🔐 Testing Authentication Flow...\n');
    
    // Step 1: Get colleges for registration
    console.log('1. Getting colleges for registration...');
    const collegesResponse = await axios.get('http://localhost:5000/api/academics/colleges');
    const colleges = collegesResponse.data;
    console.log(`✅ Found ${colleges.length} colleges`);
    
    if (colleges.length === 0) {
      console.log('❌ No colleges found, cannot test registration');
      return;
    }
    
    const firstCollege = colleges[0];
    console.log(`   Using college: ${firstCollege.name} (ID: ${firstCollege.id})`);
    
    // Step 2: Get departments for the college
    console.log('\n2. Getting departments...');
    const deptResponse = await axios.get(`http://localhost:5000/api/academics/departments?collegeId=${firstCollege.id}`);
    const departments = deptResponse.data;
    console.log(`✅ Found ${departments.length} departments`);
    
    if (departments.length === 0) {
      console.log('❌ No departments found, cannot test registration');
      return;
    }
    
    const firstDept = departments[0];
    console.log(`   Using department: ${firstDept.name} (ID: ${firstDept.id})`);
    
    // Step 3: Test registration
    console.log('\n3. Testing user registration...');
    const testUser = {
      email: `test${Date.now()}@example.com`,
      name: 'Test User',
      password: 'password123',
      role: 'student',
      collegeId: firstCollege.id,
      departmentId: firstDept.id,
      educationYear: 2,
      semester: 3
    };
    
    const registerResponse = await axios.post('http://localhost:5000/api/auth/register', testUser);
    console.log('✅ Registration successful');
    console.log(`   User ID: ${registerResponse.data.user.id}`);
    console.log(`   Token received: ${registerResponse.data.token ? 'Yes' : 'No'}`);
    
    const token = registerResponse.data.token;
    
    // Step 4: Test protected route access
    console.log('\n4. Testing protected route access...');
    const profileResponse = await axios.get('http://localhost:5000/api/users/profile', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    console.log('✅ Profile access successful');
    console.log(`   Profile name: ${profileResponse.data.name}`);
    console.log(`   Profile college: ${profileResponse.data.collegeName}`);
    
    // Step 5: Test dashboard data
    console.log('\n5. Testing dashboard data...');
    const analyticsResponse = await axios.get('http://localhost:5000/api/users/analytics', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    console.log('✅ Analytics access successful');
    console.log(`   Total notes: ${analyticsResponse.data.stats.total_notes}`);
    console.log(`   User uploads: ${analyticsResponse.data.stats.user_uploads}`);
    
    // Step 6: Test login
    console.log('\n6. Testing login...');
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      email: testUser.email,
      password: testUser.password
    });
    console.log('✅ Login successful');
    console.log(`   Login token received: ${loginResponse.data.token ? 'Yes' : 'No'}`);
    
    console.log('\n🎉 Authentication flow test completed successfully!');
    
  } catch (error) {
    console.error('❌ Authentication test failed:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
  }
}

testAuthFlow();