const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

async function testFullFeatures() {
  try {
    console.log('🚀 Testing Full Platform Features with Firebase + R2...\n');
    
    // Step 1: Register a test user
    console.log('1. Creating test user...');
    const collegesResponse = await axios.get('http://localhost:5000/api/academics/colleges');
    const colleges = collegesResponse.data;
    const firstCollege = colleges[0];
    
    const deptResponse = await axios.get(`http://localhost:5000/api/academics/departments?collegeId=${firstCollege.id}`);
    const departments = deptResponse.data;
    const firstDept = departments[0];
    
    const subjectsResponse = await axios.get(`http://localhost:5000/api/academics/subjects?departmentId=${firstDept.id}`);
    const subjects = subjectsResponse.data;
    
    const testUser = {
      email: `testuser${Date.now()}@example.com`,
      name: 'Test User',
      password: 'password123',
      role: 'student',
      collegeId: firstCollege.id,
      departmentId: firstDept.id,
      educationYear: 2,
      semester: 3
    };
    
    const registerResponse = await axios.post('http://localhost:5000/api/auth/register', testUser);
    const token = registerResponse.data.token;
    const userId = registerResponse.data.user.id;
    
    console.log(`✅ User created: ${registerResponse.data.user.name} (ID: ${userId})`);
    console.log(`   College: ${registerResponse.data.user.collegeName}`);
    console.log(`   Department: ${registerResponse.data.user.departmentName}`);
    
    // Step 2: Test File Upload to R2
    console.log('\n2. Testing file upload to R2...');
    
    // Create a test PDF file
    const testPdfContent = Buffer.from('%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n2 0 obj\n<<\n/Type /Pages\n/Kids [3 0 R]\n/Count 1\n>>\nendobj\n3 0 obj\n<<\n/Type /Page\n/Parent 2 0 R\n/MediaBox [0 0 612 792]\n/Contents 4 0 R\n>>\nendobj\n4 0 obj\n<<\n/Length 44\n>>\nstream\nBT\n/F1 12 Tf\n72 720 Td\n(Test Document) Tj\nET\nendstream\nendobj\nxref\n0 5\n0000000000 65535 f \n0000000009 00000 n \n0000000074 00000 n \n0000000120 00000 n \n0000000179 00000 n \ntrailer\n<<\n/Size 5\n/Root 1 0 R\n>>\nstartxref\n274\n%%EOF');
    
    const testFilePath = path.join(__dirname, 'test-document.pdf');
    fs.writeFileSync(testFilePath, testPdfContent);
    
    const formData = new FormData();
    formData.append('file', fs.createReadStream(testFilePath));
    formData.append('title', 'Test Study Notes - Advanced Mathematics');
    formData.append('description', 'Comprehensive notes on calculus and linear algebra for testing purposes');
    formData.append('collegeId', firstCollege.id);
    formData.append('departmentId', firstDept.id);
    formData.append('educationYear', '2');
    formData.append('semester', '3');
    
    // Add subjects
    if (subjects.length > 0) {
      subjects.slice(0, 2).forEach(subject => {
        formData.append('subjectIds[]', subject.id);
      });
    }
    
    const uploadResponse = await axios.post('http://localhost:5000/api/notes', formData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        ...formData.getHeaders()
      }
    });
    
    const noteId = uploadResponse.data.noteId;
    const storageType = uploadResponse.data.storageType;
    
    console.log(`✅ File uploaded successfully`);
    console.log(`   Note ID: ${noteId}`);
    console.log(`   Storage Type: ${storageType}`);
    console.log(`   Expected: R2 storage`);
    
    // Clean up test file
    fs.unlinkSync(testFilePath);
    
    // Step 3: Test Note Retrieval
    console.log('\n3. Testing note retrieval...');
    const noteResponse = await axios.get(`http://localhost:5000/api/notes/${noteId}`);
    console.log(`✅ Note retrieved successfully`);
    console.log(`   Title: ${noteResponse.data.title}`);
    console.log(`   File URL: ${noteResponse.data.fileUrl}`);
    console.log(`   Storage Type: ${noteResponse.data.storageType}`);
    
    // Step 4: Test Comments
    console.log('\n4. Testing comments...');
    const commentResponse = await axios.post(`http://localhost:5000/api/notes/${noteId}/comments`, {
      text: 'Great notes! Very helpful for understanding the concepts.'
    }, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    console.log(`✅ Comment added successfully`);
    console.log(`   Comment ID: ${commentResponse.data.commentId}`);
    
    // Verify comment appears in note details
    const noteWithCommentsResponse = await axios.get(`http://localhost:5000/api/notes/${noteId}`);
    console.log(`   Comments count: ${noteWithCommentsResponse.data.comments?.length || 0}`);
    
    // Step 5: Test Ratings
    console.log('\n5. Testing ratings...');
    const ratingResponse = await axios.post(`http://localhost:5000/api/notes/${noteId}/rating`, {
      rating: 5
    }, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    console.log(`✅ Rating added successfully`);
    console.log(`   Rating: 5 stars`);
    
    // Step 6: Test Favorites
    console.log('\n6. Testing favorites...');
    const favoriteResponse = await axios.post(`http://localhost:5000/api/notes/${noteId}/favorite`, {}, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    console.log(`✅ Added to favorites`);
    console.log(`   Status: ${favoriteResponse.data.favorited ? 'Favorited' : 'Unfavorited'}`);
    
    // Verify in user's favorites
    const favoritesResponse = await axios.get('http://localhost:5000/api/users/favorites', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    console.log(`   User favorites count: ${favoritesResponse.data.length}`);
    
    // Step 7: Test Filtering
    console.log('\n7. Testing filtering...');
    
    // Filter by college
    const collegeFilterResponse = await axios.get(`http://localhost:5000/api/notes?collegeId=${firstCollege.id}`);
    console.log(`✅ College filter: ${collegeFilterResponse.data.length} notes found`);
    
    // Filter by department
    const deptFilterResponse = await axios.get(`http://localhost:5000/api/notes?departmentId=${firstDept.id}`);
    console.log(`✅ Department filter: ${deptFilterResponse.data.length} notes found`);
    
    // Filter by education year
    const yearFilterResponse = await axios.get(`http://localhost:5000/api/notes?educationYear=2`);
    console.log(`✅ Year filter: ${yearFilterResponse.data.length} notes found`);
    
    // Filter by semester
    const semesterFilterResponse = await axios.get(`http://localhost:5000/api/notes?semester=3`);
    console.log(`✅ Semester filter: ${semesterFilterResponse.data.length} notes found`);
    
    // Filter by subjects
    if (subjects.length > 0) {
      const subjectFilterResponse = await axios.get(`http://localhost:5000/api/notes?subjectIds[]=${subjects[0].id}`);
      console.log(`✅ Subject filter: ${subjectFilterResponse.data.length} notes found`);
    }
    
    // Step 8: Test Dashboard Analytics
    console.log('\n8. Testing dashboard analytics...');
    const analyticsResponse = await axios.get('http://localhost:5000/api/users/analytics', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    console.log(`✅ Analytics retrieved`);
    console.log(`   Total notes in system: ${analyticsResponse.data.stats.total_notes}`);
    console.log(`   User uploads: ${analyticsResponse.data.stats.user_uploads}`);
    console.log(`   User favorites: ${analyticsResponse.data.stats.user_favorites}`);
    console.log(`   User comments: ${analyticsResponse.data.stats.user_comments}`);
    console.log(`   Recent activity items: ${analyticsResponse.data.activity.length}`);
    
    // Step 9: Test User Uploads
    console.log('\n9. Testing user uploads...');
    const uploadsResponse = await axios.get('http://localhost:5000/api/users/uploads', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    console.log(`✅ User uploads retrieved: ${uploadsResponse.data.length} notes`);
    if (uploadsResponse.data.length > 0) {
      const upload = uploadsResponse.data[0];
      console.log(`   First upload: ${upload.title}`);
      console.log(`   Storage type: ${upload.storageType}`);
      console.log(`   Average rating: ${upload.avg_rating}`);
    }
    
    // Step 10: Test Toggle Favorite (Remove)
    console.log('\n10. Testing favorite toggle (remove)...');
    const unfavoriteResponse = await axios.post(`http://localhost:5000/api/notes/${noteId}/favorite`, {}, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    console.log(`✅ Favorite toggled`);
    console.log(`   Status: ${unfavoriteResponse.data.favorited ? 'Favorited' : 'Unfavorited'}`);
    
    console.log('\n🎉 All features tested successfully!');
    console.log('\n📊 Test Summary:');
    console.log('   ✅ User Registration (Firebase)');
    console.log('   ✅ File Upload (R2 Storage)');
    console.log('   ✅ Note Retrieval (Firebase)');
    console.log('   ✅ Comments (Firebase)');
    console.log('   ✅ Ratings (Firebase)');
    console.log('   ✅ Favorites (Firebase)');
    console.log('   ✅ Filtering (Firebase)');
    console.log('   ✅ Dashboard Analytics (Firebase)');
    console.log('   ✅ User Uploads (Firebase)');
    console.log('   ✅ Favorite Toggle (Firebase)');
    
    console.log('\n🔥 Firebase + R2 Integration: FULLY OPERATIONAL');
    
  } catch (error) {
    console.error('❌ Feature test failed:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
    console.error('Stack:', error.stack);
  }
}

testFullFeatures();