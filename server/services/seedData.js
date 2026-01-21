const { getFirestoreDb, isFirebaseAvailable } = require('./firebase');

// Academic seed data
const SEED_DATA = {
  colleges: [
    'Massachusetts Institute of Technology',
    'Stanford University', 
    'Harvard University',
    'University of California Berkeley',
    'Carnegie Mellon University',
    'California Institute of Technology',
    'University of Oxford',
    'University of Cambridge',
    'ETH Zurich',
    'National University of Singapore'
  ],
  
  departments: {
    'tech': [
      'Computer Science',
      'Electrical Engineering', 
      'Mechanical Engineering',
      'Civil Engineering',
      'Chemical Engineering',
      'Biomedical Engineering',
      'Aerospace Engineering',
      'Materials Science'
    ],
    'general': [
      'Computer Science',
      'Mathematics',
      'Physics', 
      'Chemistry',
      'Biology',
      'Economics',
      'Psychology',
      'Business Administration',
      'English Literature',
      'History'
    ]
  },
  
  subjects: {
    'Computer Science': [
      'Data Structures and Algorithms',
      'Database Management Systems',
      'Operating Systems',
      'Computer Networks',
      'Software Engineering',
      'Machine Learning',
      'Artificial Intelligence',
      'Web Development',
      'Mobile App Development',
      'Cybersecurity'
    ],
    'Mathematics': [
      'Calculus I',
      'Calculus II', 
      'Linear Algebra',
      'Discrete Mathematics',
      'Statistics',
      'Probability Theory',
      'Differential Equations',
      'Number Theory'
    ],
    'Physics': [
      'Classical Mechanics',
      'Electromagnetism',
      'Thermodynamics',
      'Quantum Mechanics',
      'Relativity',
      'Optics',
      'Nuclear Physics',
      'Particle Physics'
    ],
    'Chemistry': [
      'General Chemistry',
      'Organic Chemistry',
      'Inorganic Chemistry', 
      'Physical Chemistry',
      'Analytical Chemistry',
      'Biochemistry'
    ],
    'Biology': [
      'Cell Biology',
      'Molecular Biology',
      'Genetics',
      'Ecology',
      'Evolution',
      'Microbiology',
      'Anatomy',
      'Physiology'
    ],
    'Electrical Engineering': [
      'Circuit Analysis',
      'Digital Logic Design',
      'Signals and Systems',
      'Control Systems',
      'Power Systems',
      'Electronics',
      'Microprocessors',
      'Communication Systems'
    ],
    'Mechanical Engineering': [
      'Statics',
      'Dynamics',
      'Thermodynamics',
      'Fluid Mechanics',
      'Heat Transfer',
      'Machine Design',
      'Manufacturing Processes',
      'Materials Science'
    ]
  }
};

/**
 * Seed academic data to Firestore
 */
async function seedAcademicData() {
  try {
    if (!isFirebaseAvailable()) {
      console.log('Firebase not available, skipping Firestore seeding');
      return;
    }

    const db = getFirestoreDb();
    console.log('Starting academic data seeding...');
    
    // Check if data already exists
    const collegesSnapshot = await db.collection('colleges').limit(1).get();
    if (!collegesSnapshot.empty) {
      console.log('Academic data already exists, skipping seed');
      return;
    }
    
    // Seed colleges first
    console.log('Seeding colleges...');
    const collegeIds = {};
    for (const collegeName of SEED_DATA.colleges) {
      const collegeRef = db.collection('colleges').doc();
      collegeIds[collegeName] = collegeRef.id;
      
      await collegeRef.set({
        name: collegeName,
        createdAt: new Date()
      });
    }
    console.log(`✓ Seeded ${SEED_DATA.colleges.length} colleges`);
    
    // Seed departments
    console.log('Seeding departments...');
    const departmentIds = {};
    let deptCount = 0;
    
    for (const collegeName of SEED_DATA.colleges) {
      const collegeId = collegeIds[collegeName];
      
      // Determine department type
      const deptType = collegeName.toLowerCase().includes('technology') || 
                      collegeName.toLowerCase().includes('engineering') ? 'tech' : 'general';
      
      const departments = SEED_DATA.departments[deptType];
      
      for (const deptName of departments) {
        const deptRef = db.collection('departments').doc();
        const deptKey = `${collegeName}:${deptName}`;
        departmentIds[deptKey] = deptRef.id;
        
        await deptRef.set({
          name: deptName,
          collegeId: collegeId,
          createdAt: new Date()
        });
        deptCount++;
      }
    }
    console.log(`✓ Seeded ${deptCount} departments`);
    
    // Seed subjects
    console.log('Seeding subjects...');
    let subjectCount = 0;
    
    for (const collegeName of SEED_DATA.colleges) {
      const deptType = collegeName.toLowerCase().includes('technology') || 
                      collegeName.toLowerCase().includes('engineering') ? 'tech' : 'general';
      
      const departments = SEED_DATA.departments[deptType];
      
      for (const deptName of departments) {
        const deptKey = `${collegeName}:${deptName}`;
        const departmentId = departmentIds[deptKey];
        
        const subjects = SEED_DATA.subjects[deptName] || [];
        
        for (const subjectName of subjects) {
          const subjectRef = db.collection('subjects').doc();
          
          await subjectRef.set({
            name: subjectName,
            departmentId: departmentId,
            createdAt: new Date()
          });
          subjectCount++;
        }
      }
    }
    console.log(`✓ Seeded ${subjectCount} subjects`);
    
    console.log('✅ Academic data seeding completed successfully');
    
  } catch (error) {
    console.error('Error seeding academic data:', error);
    // Don't throw error - just log it and continue
  }
}

/**
 * Get academic hierarchy for dropdowns
 */
async function getAcademicHierarchy() {
  try {
    if (!isFirebaseAvailable()) {
      throw new Error('Firebase not available');
    }

    const db = getFirestoreDb();
    const [collegesSnapshot, departmentsSnapshot, subjectsSnapshot] = await Promise.all([
      db.collection('colleges').orderBy('name').get(),
      db.collection('departments').orderBy('name').get(), 
      db.collection('subjects').orderBy('name').get()
    ]);
    
    return {
      colleges: collegesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })),
      departments: departmentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })),
      subjects: subjectsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    };
  } catch (error) {
    console.error('Error fetching academic hierarchy:', error);
    throw error;
  }
}

module.exports = {
  seedAcademicData,
  getAcademicHierarchy
};