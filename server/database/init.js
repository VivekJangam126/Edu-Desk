const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../../database.db');

function initDatabase() {
  const db = new sqlite3.Database(dbPath);

  db.serialize(() => {
    // Academic hierarchy tables
    db.run(`
      CREATE TABLE IF NOT EXISTS colleges (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS departments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        college_id INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (college_id) REFERENCES colleges (id) ON DELETE CASCADE,
        UNIQUE(name, college_id)
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS subjects (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        department_id INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (department_id) REFERENCES departments (id) ON DELETE CASCADE,
        UNIQUE(name, department_id)
      )
    `);

    // Users table
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        password TEXT NOT NULL,
        role TEXT DEFAULT 'student',
        college_id INTEGER,
        department_id INTEGER,
        education_year INTEGER,
        semester INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (college_id) REFERENCES colleges (id) ON DELETE SET NULL,
        FOREIGN KEY (department_id) REFERENCES departments (id) ON DELETE SET NULL
      )
    `);

    // Add new columns to existing users table if they don't exist
    db.run(`ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'student'`, () => {});
    db.run(`ALTER TABLE users ADD COLUMN college_id INTEGER`, () => {});
    db.run(`ALTER TABLE users ADD COLUMN department_id INTEGER`, () => {});
    db.run(`ALTER TABLE users ADD COLUMN education_year INTEGER`, () => {});
    db.run(`ALTER TABLE users ADD COLUMN semester INTEGER`, () => {});

    // Notes table
    db.run(`
      CREATE TABLE IF NOT EXISTS notes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT,
        file_url TEXT NOT NULL,
        file_name TEXT NOT NULL,
        uploaded_by INTEGER NOT NULL,
        college_id INTEGER,
        department_id INTEGER,
        education_year INTEGER,
        semester INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (uploaded_by) REFERENCES users (id),
        FOREIGN KEY (college_id) REFERENCES colleges (id) ON DELETE SET NULL,
        FOREIGN KEY (department_id) REFERENCES departments (id) ON DELETE SET NULL
      )
    `);

    // Note-Subject junction table (many-to-many)
    db.run(`
      CREATE TABLE IF NOT EXISTS note_subjects (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        note_id INTEGER NOT NULL,
        subject_id INTEGER NOT NULL,
        FOREIGN KEY (note_id) REFERENCES notes (id) ON DELETE CASCADE,
        FOREIGN KEY (subject_id) REFERENCES subjects (id) ON DELETE CASCADE,
        UNIQUE(note_id, subject_id)
      )
    `);

    // Add new columns to existing notes table if they don't exist
    db.run(`ALTER TABLE notes ADD COLUMN college_id INTEGER`, () => {});
    db.run(`ALTER TABLE notes ADD COLUMN department_id INTEGER`, () => {});
    db.run(`ALTER TABLE notes ADD COLUMN education_year INTEGER`, () => {});
    db.run(`ALTER TABLE notes ADD COLUMN semester INTEGER`, () => {});

    // Comments table
    db.run(`
      CREATE TABLE IF NOT EXISTS comments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        note_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        text TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (note_id) REFERENCES notes (id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users (id)
      )
    `);

    // Ratings table
    db.run(`
      CREATE TABLE IF NOT EXISTS ratings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        note_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(note_id, user_id),
        FOREIGN KEY (note_id) REFERENCES notes (id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users (id)
      )
    `);

    // Favorites table
    db.run(`
      CREATE TABLE IF NOT EXISTS favorites (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        note_id INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, note_id),
        FOREIGN KEY (user_id) REFERENCES users (id),
        FOREIGN KEY (note_id) REFERENCES notes (id) ON DELETE CASCADE
      )
    `);

    // Create indexes for performance
    db.run(`CREATE INDEX IF NOT EXISTS idx_departments_college_id ON departments(college_id)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_subjects_department_id ON subjects(department_id)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_users_college_id ON users(college_id)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_users_department_id ON users(department_id)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_notes_college_id ON notes(college_id)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_notes_department_id ON notes(department_id)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_note_subjects_note_id ON note_subjects(note_id)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_note_subjects_subject_id ON note_subjects(subject_id)`);

    // Insert seed data if tables are empty
    db.get('SELECT COUNT(*) as count FROM colleges', [], (err, result) => {
      if (!err && result.count === 0) {
        insertSeedData(db, () => {
          db.close();
          console.log('Database initialized successfully');
        });
      } else {
        db.close();
        console.log('Database initialized successfully');
      }
    });
  });
}

function insertSeedData(db, callback) {
  console.log('Inserting seed academic data...');
  
  // Sample colleges
  const colleges = [
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
  ];

  // Sample departments by college type
  const departments = {
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
  };

  // Sample subjects by department
  const subjects = {
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
  };

  let completedColleges = 0;
  const totalColleges = colleges.length;

  // Insert colleges
  colleges.forEach((collegeName, index) => {
    db.run('INSERT OR IGNORE INTO colleges (name) VALUES (?)', [collegeName], function(err) {
      if (!err) {
        const collegeId = this.lastID || index + 1;
        
        // Determine department type based on college name
        const deptType = collegeName.toLowerCase().includes('technology') || 
                        collegeName.toLowerCase().includes('engineering') ? 'tech' : 'general';
        
        const collegeDepartments = departments[deptType];
        let completedDepartments = 0;
        const totalDepartments = collegeDepartments.length;
        
        // Insert departments for this college
        collegeDepartments.forEach(deptName => {
          db.run('INSERT OR IGNORE INTO departments (name, college_id) VALUES (?, ?)', 
            [deptName, collegeId], function(err) {
            if (!err) {
              const departmentId = this.lastID;
              
              // Insert subjects for this department
              const deptSubjects = subjects[deptName] || [];
              let completedSubjects = 0;
              const totalSubjects = deptSubjects.length;
              
              if (totalSubjects === 0) {
                completedDepartments++;
                if (completedDepartments === totalDepartments) {
                  completedColleges++;
                  if (completedColleges === totalColleges) {
                    console.log('Seed data insertion completed');
                    callback();
                  }
                }
              } else {
                deptSubjects.forEach(subjectName => {
                  db.run('INSERT OR IGNORE INTO subjects (name, department_id) VALUES (?, ?)', 
                    [subjectName, departmentId], function(err) {
                    completedSubjects++;
                    if (completedSubjects === totalSubjects) {
                      completedDepartments++;
                      if (completedDepartments === totalDepartments) {
                        completedColleges++;
                        if (completedColleges === totalColleges) {
                          console.log('Seed data insertion completed');
                          callback();
                        }
                      }
                    }
                  });
                });
              }
            } else {
              completedDepartments++;
              if (completedDepartments === totalDepartments) {
                completedColleges++;
                if (completedColleges === totalColleges) {
                  console.log('Seed data insertion completed');
                  callback();
                }
              }
            }
          });
        });
      } else {
        completedColleges++;
        if (completedColleges === totalColleges) {
          console.log('Seed data insertion completed');
          callback();
        }
      }
    });
  });
}

function getDatabase() {
  return new sqlite3.Database(dbPath);
}

module.exports = { initDatabase, getDatabase };