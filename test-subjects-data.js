const axios = require('axios');

async function testSubjectsData() {
  try {
    console.log('📚 Testing Subjects Data...\n');
    
    // Get all colleges
    const collegesResponse = await axios.get('http://localhost:5000/api/academics/colleges');
    const colleges = collegesResponse.data;
    
    console.log(`✅ Found ${colleges.length} colleges`);
    
    for (let i = 0; i < Math.min(3, colleges.length); i++) {
      const college = colleges[i];
      console.log(`\n🏫 College: ${college.name}`);
      
      // Get departments for this college
      const deptResponse = await axios.get(`http://localhost:5000/api/academics/departments?collegeId=${college.id}`);
      const departments = deptResponse.data;
      
      console.log(`   📖 Departments: ${departments.length}`);
      
      for (let j = 0; j < Math.min(2, departments.length); j++) {
        const dept = departments[j];
        console.log(`     - ${dept.name}`);
        
        // Get subjects for this department
        const subjectsResponse = await axios.get(`http://localhost:5000/api/academics/subjects?departmentId=${dept.id}`);
        const subjects = subjectsResponse.data;
        
        console.log(`       📝 Subjects: ${subjects.length}`);
        subjects.slice(0, 3).forEach(subject => {
          console.log(`         • ${subject.name}`);
        });
      }
    }
    
    // Test with a department that should have subjects
    console.log('\n🔍 Testing Computer Science department...');
    const csDepts = [];
    
    for (const college of colleges) {
      const deptResponse = await axios.get(`http://localhost:5000/api/academics/departments?collegeId=${college.id}`);
      const departments = deptResponse.data;
      
      const csDept = departments.find(d => d.name.toLowerCase().includes('computer'));
      if (csDept) {
        csDepts.push({ college: college.name, dept: csDept });
      }
    }
    
    if (csDepts.length > 0) {
      const { college, dept } = csDepts[0];
      console.log(`✅ Found CS department: ${dept.name} at ${college}`);
      
      const subjectsResponse = await axios.get(`http://localhost:5000/api/academics/subjects?departmentId=${dept.id}`);
      const subjects = subjectsResponse.data;
      
      console.log(`   📝 CS Subjects: ${subjects.length}`);
      subjects.forEach(subject => {
        console.log(`     • ${subject.name} (ID: ${subject.id})`);
      });
    }
    
    console.log('\n🎉 Subjects data test completed!');
    
  } catch (error) {
    console.error('❌ Subjects data test failed:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
  }
}

testSubjectsData();