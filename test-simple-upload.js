const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

async function testSimpleUpload() {
  try {
    console.log('🧪 Simple Upload Test...\n');
    
    // Get academic data
    const collegesResponse = await axios.get('http://localhost:5000/api/academics/colleges');
    const firstCollege = collegesResponse.data[0];
    
    const deptResponse = await axios.get(`http://localhost:5000/api/academics/departments?collegeId=${firstCollege.id}`);
    const csDept = deptResponse.data.find(d => d.name.toLowerCase().includes('computer'));
    
    const subjectsResponse = await axios.get(`http://localhost:5000/api/academics/subjects?departmentId=${csDept.id}`);
    const subjects = subjectsResponse.data;
    
    // Register user
    const testUser = {
      email: `simpleuser${Date.now()}@example.com`,
      name: 'Simple User',
      password: 'password123',
      role: 'student',
      collegeId: firstCollege.id,
      departmentId: csDept.id,
      educationYear: 1,
      semester: 2
    };
    
    const registerResponse = await axios.post('http://localhost:5000/api/auth/register', testUser);
    const token = registerResponse.data.token;
    
    // Create test file
    const testPdfContent = Buffer.from('%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n2 0 obj\n<<\n/Type /Pages\n/Kids [3 0 R]\n/Count 1\n>>\nendobj\n3 0 obj\n<<\n/Type /Page\n/Parent 2 0 R\n/MediaBox [0 0 612 792]\n>>\nendobj\nxref\n0 4\n0000000000 65535 f \n0000000009 00000 n \n0000000074 00000 n \n0000000120 00000 n \ntrailer\n<<\n/Size 4\n/Root 1 0 R\n>>\nstartxref\n179\n%%EOF');
    
    const testFilePath = path.join(__dirname, 'simple-test.pdf');
    fs.writeFileSync(testFilePath, testPdfContent);
    
    // Create FormData
    const formData = new FormData();
    formData.append('file', fs.createReadStream(testFilePath));
    formData.append('title', 'Simple Test Note');
    formData.append('description', 'Testing with subjects');
    formData.append('collegeId', firstCollege.id);
    formData.append('departmentId', csDept.id);
    formData.append('educationYear', '1');
    formData.append('semester', '2');
    
    // Add subjects
    console.log(`Adding subjects:`);
    console.log(`   1. ${subjects[0].name} (${subjects[0].id})`);
    console.log(`   2. ${subjects[1].name} (${subjects[1].id})`);
    
    formData.append('subjectIds[]', subjects[0].id);
    formData.append('subjectIds[]', subjects[1].id);
    
    // Upload
    const uploadResponse = await axios.post('http://localhost:5000/api/notes', formData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        ...formData.getHeaders()
      }
    });
    
    console.log(`✅ Upload successful: ${uploadResponse.data.noteId}`);
    
    // Clean up
    fs.unlinkSync(testFilePath);
    
  } catch (error) {
    console.error('❌ Simple upload failed:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
  }
}

testSimpleUpload();