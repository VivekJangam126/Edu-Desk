const jwt = require('jsonwebtoken');
const { getDatabase } = require('../database/init');
const { getFirestoreDb, isFirebaseAvailable } = require('../services/firebase');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
    if (isFirebaseAvailable()) {
      // Use Firestore
      const db = getFirestoreDb();
      const userDoc = await db.collection('users').doc(decoded.id).get();
      
      if (!userDoc.exists) {
        return res.status(403).json({ error: 'User not found' });
      }
      
      const userData = userDoc.data();
      
      // Get college and department names if they exist
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
      
      req.user = {
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
      };
      
      next();
    } else {
      // Fallback to SQLite
      const db = getDatabase();
      const query = `
        SELECT 
          u.id, u.email, u.name, u.role, u.college_id, u.department_id, u.education_year, u.semester,
          c.name as college_name, d.name as department_name
        FROM users u
        LEFT JOIN colleges c ON u.college_id = c.id
        LEFT JOIN departments d ON u.department_id = d.id
        WHERE u.id = ?
      `;
      
      db.get(query, [decoded.id], (err, dbUser) => {
        db.close();
        
        if (err || !dbUser) {
          return res.status(403).json({ error: 'User not found' });
        }

        req.user = {
          id: dbUser.id,
          email: dbUser.email,
          name: dbUser.name,
          role: dbUser.role || 'student',
          collegeId: dbUser.college_id,
          departmentId: dbUser.department_id,
          collegeName: dbUser.college_name,
          departmentName: dbUser.department_name,
          educationYear: dbUser.education_year,
          semester: dbUser.semester
        };
        next();
      });
    }
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};

module.exports = { authenticateToken, JWT_SECRET };