const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

async function testDebugUpload() {
  try {
    console.log('🐛 Debug Upload Process...\n');
    
    // Get academic data
    const collegesResponse = await axios.get('http://localhost:5000/api/academics/colleges');
    const colleges = collegesResponse.data;
    const firstCollege = colleges[0];
    
    const deptResponse = await axios.get(`http://localhost:5000/api/academics/departments?collegeId=${firstCollege.id}`);
    const departments = deptResponse.data;
    const csDept = departments.find(d => d.name.toLowerCase().includes('computer'));
    
    const subjectsResponse = await axios.get(`http://localhost:5000/api/academics/subjects?departmentId=${csDept.id}`);
    const subjects = subjectsResponse.data;
    
    console.log(`✅ Found ${subjects.length} subjects`);
    console.log(`   First 3 subjects:`);
    subjects.slice(0, 3).forEach((subject, index) => {
      console.log(`     ${index + 1}. ${subject.name} (ID: ${subject.id})`);
    });
    
    // Register user
    const testUser = {
      email: `debuguser${Date.now()}@example.com`,
      name: 'Debug User',
      password: 'password123',
      role: 'student',
      collegeId: firstCollege.id,
      departmentId: csDept.id,
      educationYear: 2,
      semester: 4
    };
    
    const registerResponse = await axios.post('http://localhost:5000/api/auth/register', testUser);
    const token = registerResponse.data.token;
    
    console.log(`✅ User registered: ${registerResponse.data.user.name}`);
    
    // Create test file
    const testPdfContent = Buffer.from('%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n2 0 obj\n<<\n/Type /Pages\n/Kids [3 0 R]\n/Count 1\n>>\nendobj\n3 0 obj\n<<\n/Type /Page\n/Parent 2 0 R\n/MediaBox [0 0 612 792]\n>>\nendobj\nxref\n0 4\n0000000000 65535 f \n0000000009 00000 n \n0000000074 00000 n \n0000000120 00000 n \ntrailer\n<<\n/Size 4\n/Root 1 0 R\n>>\nstartxref\n179\n%%EOF');
    
    const testFilePath = path.join(__dirname, 'debug-test.pdf');
    fs.writeFileSync(testFilePath, testPdfContent);
    
    // Create FormData with explicit subject IDs
    const formData = new FormData();
    formData.append('file', fs.createReadStream(testFilePath));
    formData.append('title', 'Debug Test Note');
    formData.append('description', 'Testing subject ID processing');
    formData.append('collegeId', firstCollege.id);
    formData.append('departmentId', csDept.id);
    formData.append('educationYear', '2');
    formData.append('semester', '4');
    
    // Add subjects explicitly
    const selectedSubjects = subjects.slice(0, 2); // Take first 2 subjects
    console.log(`\n📝 Adding subjects to form:`);
    selectedSubjects.forEach((subject, index) => {
      console.log(`   ${index + 1}. ${subject.name} (ID: ${subject.id})`);
      formData.append('subjectIds[]', subject.id);
    });
    
    // Debug: Log form data
    console.log(`\n🔍 FormData entries:`);
    for (const [key, value] of formData.entries()) {
      if (key !== 'file') {
        console.log(`   ${key}: ${value}`);
      } else {
        console.log(`   ${key}: [File Stream]`);
      }
    }
    
    // Upload
    console.log(`\n📤 Uploading note...`);
    const uploadResponse = await axios.post('http://localhost:5000/api/notes', formData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        ...formData.getHeaders()
      }
    });
    
    const noteId = uploadResponse.data.noteId;
    console.log(`✅ Upload successful: ${noteId}`);
    
    // Retrieve and check
    console.log(`\n🔍 Retrieving note to check subjects...`);
    const noteResponse = await axios.get(`http://localhost:5000/api/notes/${noteId}`);
    const note = noteResponse.data;
    
    console.log(`   Title: ${note.title}`);
    console.log(`   Subject IDs in response: ${note.subjectIds ? JSON.stringify(note.subjectIds) : 'None'}`);
    console.log(`   Subject IDs length: ${note.subjectIds ? note.subjectIds.length : 0}`);
    
    // Clean up
    fs.unlinkSync(testFilePath);
    
    console.log('\n🎉 Debug upload completed!');
    
  } catch (error) {
    console.error('❌ Debug upload failed:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

testDebugUpload();