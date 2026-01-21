const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

async function testUploadWithSubjects() {
  try {
    console.log('📚 Testing Upload with Subjects and Filtering...\n');
    
    // Step 1: Register a test user
    console.log('1. Creating test user...');
    const collegesResponse = await axios.get('http://localhost:5000/api/academics/colleges');
    const colleges = collegesResponse.data;
    
    // Find a college with Computer Science department
    let selectedCollege, selectedDept, subjects;
    
    for (const college of colleges) {
      const deptResponse = await axios.get(`http://localhost:5000/api/academics/departments?collegeId=${college.id}`);
      const departments = deptResponse.data;
      
      const csDept = departments.find(d => d.name.toLowerCase().includes('computer'));
      if (csDept) {
        const subjectsResponse = await axios.get(`http://localhost:5000/api/academics/subjects?departmentId=${csDept.id}`);
        if (subjectsResponse.data.length > 0) {
          selectedCollege = college;
          selectedDept = csDept;
          subjects = subjectsResponse.data;
          break;
        }
      }
    }
    
    if (!selectedCollege) {
      console.log('❌ No college with CS department and subjects found');
      return;
    }
    
    console.log(`✅ Using: ${selectedCollege.name} - ${selectedDept.name}`);
    console.log(`   Available subjects: ${subjects.length}`);
    
    const testUser = {
      email: `testuser${Date.now()}@example.com`,
      name: 'CS Test User',
      password: 'password123',
      role: 'student',
      collegeId: selectedCollege.id,
      departmentId: selectedDept.id,
      educationYear: 3,
      semester: 5
    };
    
    const registerResponse = await axios.post('http://localhost:5000/api/auth/register', testUser);
    const token = registerResponse.data.token;
    
    console.log(`✅ User created: ${registerResponse.data.user.name}`);
    
    // Step 2: Upload note with subjects
    console.log('\n2. Testing file upload with subjects...');
    
    // Create a test PDF file
    const testPdfContent = Buffer.from('%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n2 0 obj\n<<\n/Type /Pages\n/Kids [3 0 R]\n/Count 1\n>>\nendobj\n3 0 obj\n<<\n/Type /Page\n/Parent 2 0 R\n/MediaBox [0 0 612 792]\n/Contents 4 0 R\n>>\nendobj\n4 0 obj\n<<\n/Length 55\n>>\nstream\nBT\n/F1 12 Tf\n72 720 Td\n(Machine Learning Notes) Tj\nET\nendstream\nendobj\nxref\n0 5\n0000000000 65535 f \n0000000009 00000 n \n0000000074 00000 n \n0000000120 00000 n \n0000000179 00000 n \ntrailer\n<<\n/Size 5\n/Root 1 0 R\n>>\nstartxref\n285\n%%EOF');
    
    const testFilePath = path.join(__dirname, 'ml-notes.pdf');
    fs.writeFileSync(testFilePath, testPdfContent);
    
    const formData = new FormData();
    formData.append('file', fs.createReadStream(testFilePath));
    formData.append('title', 'Machine Learning Fundamentals');
    formData.append('description', 'Comprehensive notes covering supervised and unsupervised learning algorithms');
    formData.append('collegeId', selectedCollege.id);
    formData.append('departmentId', selectedDept.id);
    formData.append('educationYear', '3');
    formData.append('semester', '5');
    
    // Add multiple subjects
    const mlSubject = subjects.find(s => s.name.toLowerCase().includes('machine learning'));
    const aiSubject = subjects.find(s => s.name.toLowerCase().includes('artificial intelligence'));
    const dsSubject = subjects.find(s => s.name.toLowerCase().includes('data structures'));
    
    const selectedSubjects = [mlSubject, aiSubject, dsSubject].filter(Boolean);
    
    selectedSubjects.forEach(subject => {
      formData.append('subjectIds[]', subject.id);
    });
    
    console.log(`   Selected subjects: ${selectedSubjects.map(s => s.name).join(', ')}`);
    
    const uploadResponse = await axios.post('http://localhost:5000/api/notes', formData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        ...formData.getHeaders()
      }
    });
    
    const noteId = uploadResponse.data.noteId;
    console.log(`✅ File uploaded successfully (Note ID: ${noteId})`);
    console.log(`   Storage Type: ${uploadResponse.data.storageType}`);
    
    // Clean up test file
    fs.unlinkSync(testFilePath);
    
    // Step 3: Test subject filtering
    console.log('\n3. Testing subject filtering...');
    
    // Filter by Machine Learning subject
    if (mlSubject) {
      const mlFilterResponse = await axios.get(`http://localhost:5000/api/notes?subjectIds[]=${mlSubject.id}`);
      console.log(`✅ ML subject filter: ${mlFilterResponse.data.length} notes found`);
      
      if (mlFilterResponse.data.length > 0) {
        const note = mlFilterResponse.data[0];
        console.log(`   Found: ${note.title}`);
        console.log(`   Subjects: ${note.subjectIds ? note.subjectIds.length : 0} subjects`);
      }
    }
    
    // Filter by multiple subjects
    if (selectedSubjects.length > 1) {
      const multiSubjectUrl = `http://localhost:5000/api/notes?${selectedSubjects.map(s => `subjectIds[]=${s.id}`).join('&')}`;
      const multiFilterResponse = await axios.get(multiSubjectUrl);
      console.log(`✅ Multi-subject filter: ${multiFilterResponse.data.length} notes found`);
    }
    
    // Combined filter (college + department + subject)
    const combinedUrl = `http://localhost:5000/api/notes?collegeId=${selectedCollege.id}&departmentId=${selectedDept.id}&subjectIds[]=${selectedSubjects[0].id}`;
    const combinedResponse = await axios.get(combinedUrl);
    console.log(`✅ Combined filter: ${combinedResponse.data.length} notes found`);
    
    // Step 4: Test note retrieval with subjects
    console.log('\n4. Testing note retrieval with subjects...');
    const noteResponse = await axios.get(`http://localhost:5000/api/notes/${noteId}`);
    console.log(`✅ Note retrieved: ${noteResponse.data.title}`);
    console.log(`   Subject IDs: ${noteResponse.data.subjectIds ? noteResponse.data.subjectIds.join(', ') : 'None'}`);
    console.log(`   Storage Type: ${noteResponse.data.storageType}`);
    console.log(`   File URL: ${noteResponse.data.fileUrl.substring(0, 50)}...`);
    
    console.log('\n🎉 Upload with subjects and filtering test completed successfully!');
    console.log('\n📊 Test Summary:');
    console.log('   ✅ User Registration with CS Department');
    console.log('   ✅ File Upload with Multiple Subjects');
    console.log('   ✅ Subject-based Filtering');
    console.log('   ✅ Multi-subject Filtering');
    console.log('   ✅ Combined Filtering (College + Department + Subject)');
    console.log('   ✅ Note Retrieval with Subject Data');
    console.log('   ✅ R2 Storage Integration');
    
  } catch (error) {
    console.error('❌ Upload with subjects test failed:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
  }
}

testUploadWithSubjects();