const axios = require('axios');

async function testMigration() {
  try {
    console.log('🧪 Testing Migration API...\n');
    
    // Test migration status
    console.log('1. Checking migration status...');
    const statusResponse = await axios.get('http://localhost:5000/api/migration/status');
    console.log('✅ Migration Status:', JSON.stringify(statusResponse.data, null, 2));
    
    // Test academic data migration
    console.log('\n2. Testing academic data migration...');
    const academicResponse = await axios.post('http://localhost:5000/api/migration/academic');
    console.log('✅ Academic Migration:', academicResponse.data.message);
    
    console.log('\n🎉 Migration tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration test failed:', error.response?.data || error.message);
  }
}

testMigration();