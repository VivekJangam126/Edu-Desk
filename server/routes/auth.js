

const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { getDatabase } = require('../database/init');
const { getFirestoreDb, isFirebaseAvailable } = require('../services/firebase');
const { JWT_SECRET } = require('../middleware/auth');

const router = express.Router();

// Register
router.post('/register', [
  body('email').isEmail().normalizeEmail(),
  body('name').trim().isLength({ min: 2, max: 50 }),
  body('password').isLength({ min: 6 }),
  body('role').optional().isIn(['student', 'educator']),
  body('collegeId').optional().isString(),
  body('departmentId').optional().isString(),
  body('educationYear').optional().isInt({ min: 1, max: 4 }),
  body('semester').optional().isInt({ min: 1, max: 8 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, name, password, role = 'student', collegeId, departmentId, educationYear, semester } = req.body;

    // Validate academic fields for students
    if (role === 'student') {
      if (!collegeId || !departmentId || !educationYear || !semester) {
        return res.status(400).json({ 
          error: 'Academic information (college, department, education year, semester) is required for students' 
        });
      }
    }

    if (isFirebaseAvailable()) {
      // Use Firestore
      const db = getFirestoreDb();
      
      // Check if user already exists
      const existingUserQuery = await db.collection('users').where('email', '==', email).get();
      if (!existingUserQuery.empty) {
        return res.status(400).json({ error: 'User already exists' });
      }

      // Validate department belongs to college for students
      if (role === 'student' && collegeId && departmentId) {
        const departmentDoc = await db.collection('departments').doc(departmentId).get();
        if (!departmentDoc.exists || departmentDoc.data().collegeId !== collegeId) {
          return res.status(400).json({ error: 'Invalid department for selected college' });
        }
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 12);

      // Create user in Firestore
      const userRef = db.collection('users').doc();
      await userRef.set({
        email,
        name,
        password: hashedPassword,
        role,
        collegeId: collegeId || null,
        departmentId: departmentId || null,
        educationYear: educationYear || null,
        semester: semester || null,
        createdAt: new Date()
      });

      // Generate JWT
      const token = jwt.sign({ id: userRef.id, email }, JWT_SECRET, { expiresIn: '7d' });

      // Get college and department names for response
      let collegeName = null;
      let departmentName = null;

      if (collegeId) {
        const collegeDoc = await db.collection('colleges').doc(collegeId).get();
        if (collegeDoc.exists) {
          collegeName = collegeDoc.data().name;
        }
      }

      if (departmentId) {
        const departmentDoc = await db.collection('departments').doc(departmentId).get();
        if (departmentDoc.exists) {
          departmentName = departmentDoc.data().name;
        }
      }

      res.status(201).json({
        message: 'User created successfully',
        token,
        user: { 
          id: userRef.id, 
          email, 
          name, 
          role,
          collegeId: collegeId || null,
          departmentId: departmentId || null,
          collegeName,
          departmentName,
          educationYear: educationYear || null,
          semester: semester || null
        }
      });
    } else {
      // Fallback to SQLite
      if (role === 'student') {
        // Validate that department belongs to college
        const db = getDatabase();
        db.get('SELECT id FROM departments WHERE id = ? AND college_id = ?', [departmentId, collegeId], (err, dept) => {
          if (err || !dept) {
            db.close();
            return res.status(400).json({ error: 'Invalid department for selected college' });
          }
          
          createUserSQLite();
        });
      } else {
        createUserSQLite();
      }

      function createUserSQLite() {
        const db = getDatabase();

        // Check if user already exists
        db.get('SELECT id FROM users WHERE email = ?', [email], async (err, existingUser) => {
          if (err) {
            db.close();
            return res.status(500).json({ error: 'Database error' });
          }

          if (existingUser) {
            db.close();
            return res.status(400).json({ error: 'User already exists' });
          }

          // Hash password
          const hashedPassword = await bcrypt.hash(password, 12);

          // Create user
          db.run(
            'INSERT INTO users (email, name, password, role, college_id, department_id, education_year, semester) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [email, name, hashedPassword, role, collegeId || null, departmentId || null, educationYear || null, semester || null],
            function(err) {
              if (err) {
                db.close();
                return res.status(500).json({ error: 'Failed to create user' });
              }

              const userId = this.lastID;
              
              // Generate JWT
              const token = jwt.sign({ id: userId, email }, JWT_SECRET, { expiresIn: '7d' });

              // Get college and department names for response
              if (collegeId && departmentId) {
                const query = `
                  SELECT c.name as college_name, d.name as department_name
                  FROM colleges c, departments d
                  WHERE c.id = ? AND d.id = ?
                `;
                
                db.get(query, [collegeId, departmentId], (err, names) => {
                  db.close();
                  
                  res.status(201).json({
                    message: 'User created successfully',
                    token,
                    user: { 
                      id: userId, 
                      email, 
                      name, 
                      role,
                      collegeId: collegeId || null,
                      departmentId: departmentId || null,
                      collegeName: names?.college_name || null,
                      departmentName: names?.department_name || null,
                      educationYear: educationYear || null,
                      semester: semester || null
                    }
                  });
                });
              } else {
                db.close();
                res.status(201).json({
                  message: 'User created successfully',
                  token,
                  user: { 
                    id: userId, 
                    email, 
                    name, 
                    role,
                    collegeId: null,
                    departmentId: null,
                    collegeName: null,
                    departmentName: null,
                    educationYear: null,
                    semester: null
                  }
                });
              }
            }
          );
        });
      }
    }
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Login
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').exists()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    if (isFirebaseAvailable()) {
      // Use Firestore
      const db = getFirestoreDb();
      
      const userQuery = await db.collection('users').where('email', '==', email).get();
      if (userQuery.empty) {
        return res.status(400).json({ error: 'Invalid credentials' });
      }

      const userDoc = userQuery.docs[0];
      const userData = userDoc.data();

      // Check password
      const isValidPassword = await bcrypt.compare(password, userData.password);
      if (!isValidPassword) {
        return res.status(400).json({ error: 'Invalid credentials' });
      }

      // Get college and department names if user has them
      let collegeName = null;
      let departmentName = null;

      if (userData.collegeId) {
        const collegeDoc = await db.collection('colleges').doc(userData.collegeId).get();
        if (collegeDoc.exists) {
          collegeName = collegeDoc.data().name;
        }
      }

      if (userData.departmentId) {
        const departmentDoc = await db.collection('departments').doc(userData.departmentId).get();
        if (departmentDoc.exists) {
          departmentName = departmentDoc.data().name;
        }
      }

      // Generate JWT
      const token = jwt.sign({ id: userDoc.id, email: userData.email }, JWT_SECRET, { expiresIn: '7d' });

      res.json({
        message: 'Login successful',
        token,
        user: { 
          id: userDoc.id, 
          email: userData.email, 
          name: userData.name,
          role: userData.role || 'student',
          collegeId: userData.collegeId || null,
          departmentId: userData.departmentId || null,
          collegeName,
          departmentName,
          educationYear: userData.educationYear || null,
          semester: userData.semester || null
        }
      });
    } else {
      // Fallback to SQLite
      const db = getDatabase();

      db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
        if (err) {
          db.close();
          return res.status(500).json({ error: 'Database error' });
        }

        if (!user) {
          db.close();
          return res.status(400).json({ error: 'Invalid credentials' });
        }

        // Check password
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
          db.close();
          return res.status(400).json({ error: 'Invalid credentials' });
        }

        // Get college and department names if user has them
        if (user.college_id && user.department_id) {
          const query = `
            SELECT c.name as college_name, d.name as department_name
            FROM colleges c, departments d
            WHERE c.id = ? AND d.id = ?
          `;
          
          db.get(query, [user.college_id, user.department_id], (err, names) => {
            db.close();
            
            // Generate JWT
            const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

            res.json({
              message: 'Login successful',
              token,
              user: { 
                id: user.id, 
                email: user.email, 
                name: user.name,
                role: user.role || 'student',
                collegeId: user.college_id,
                departmentId: user.department_id,
                collegeName: names?.college_name || null,
                departmentName: names?.department_name || null,
                educationYear: user.education_year,
                semester: user.semester
              }
            });
          });
        } else {
          db.close();
          
          // Generate JWT
          const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

          res.json({
            message: 'Login successful',
            token,
            user: { 
              id: user.id, 
              email: user.email, 
              name: user.name,
              role: user.role || 'student',
              collegeId: user.college_id,
              departmentId: user.department_id,
              collegeName: null,
              departmentName: null,
              educationYear: user.education_year,
              semester: user.semester
            }
          });
        }
      });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;