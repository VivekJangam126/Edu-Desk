const axios = require('axios');

async function testSubjectFilter() {
  try {
    console.log('🔍 Testing Subject Filtering...\n');
    
    // Get academic data
    const collegesResponse = await axios.get('http://localhost:5000/api/academics/colleges');
    const firstCollege = collegesResponse.data[0];
    
    const deptResponse = await axios.get(`http://localhost:5000/api/academics/departments?collegeId=${firstCollege.id}`);
    const firstDept = deptResponse.data[0];
    
    const subjectsResponse = await axios.get(`http://localhost:5000/api/academics/subjects?departmentId=${firstDept.id}`);
    const subjects = subjectsResponse.data;
    
    console.log(`✅ Found ${subjects.length} subjects in ${firstDept.name}`);
    subjects.slice(0, 3).forEach((subject, index) => {
      console.log(`   ${index + 1}. ${subject.name} (ID: ${subject.id})`);
    });
    
    // Test subject filtering
    if (subjects.length > 0) {
      console.log('\n🔍 Testing subject filtering...');
      
      // Filter by single subject
      const singleSubjectResponse = await axios.get(`http://localhost:5000/api/notes?subjectIds[]=${subjects[0].id}`);
      console.log(`✅ Single subject filter (${subjects[0].name}): ${singleSubjectResponse.data.length} notes found`);
      
      // Filter by multiple subjects
      if (subjects.length > 1) {
        const multiSubjectUrl = `http://localhost:5000/api/notes?subjectIds[]=${subjects[0].id}&subjectIds[]=${subjects[1].id}`;
        const multiSubjectResponse = await axios.get(multiSubjectUrl);
        console.log(`✅ Multi-subject filter: ${multiSubjectResponse.data.length} notes found`);
      }
      
      // Combined filters
      const combinedUrl = `http://localhost:5000/api/notes?collegeId=${firstCollege.id}&departmentId=${firstDept.id}&subjectIds[]=${subjects[0].id}`;
      const combinedResponse = await axios.get(combinedUrl);
      console.log(`✅ Combined filter (college + department + subject): ${combinedResponse.data.length} notes found`);
      
      if (combinedResponse.data.length > 0) {
        const note = combinedResponse.data[0];
        console.log(`   Found note: ${note.title}`);
        console.log(`   Storage type: ${note.storageType}`);
        console.log(`   Subject IDs: ${note.subjectIds ? note.subjectIds.join(', ') : 'None'}`);
      }
    }
    
    console.log('\n🎉 Subject filtering test completed successfully!');
    
  } catch (error) {
    console.error('❌ Subject filter test failed:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
  }
}

testSubjectFilter();