const express = require('express');
const { getFirestoreDb, isFirebaseAvailable } = require('../services/firebase');
const { getDatabase } = require('../database/init'); // Fallback to SQLite

const router = express.Router();

// Get all colleges
router.get('/colleges', async (req, res) => {
  try {
    // Use Firestore if available, otherwise fallback to SQLite
    if (isFirebaseAvailable()) {
      const db = getFirestoreDb();
      const snapshot = await db.collection('colleges')
        .orderBy('name', 'asc')
        .get();
      
      const colleges = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      res.json(colleges);
    } else {
      // Fallback to SQLite
      const db = getDatabase();
      db.all('SELECT id, name FROM colleges ORDER BY name ASC', [], (err, colleges) => {
        db.close();
        
        if (err) {
          console.error('Error fetching colleges:', err);
          return res.status(500).json({ error: 'Database error' });
        }

        res.json(colleges);
      });
    }
  } catch (error) {
    console.error('Error fetching colleges:', error);
    res.status(500).json({ error: 'Failed to fetch colleges' });
  }
});

// Get departments by college
router.get('/departments', async (req, res) => {
  try {
    const { collegeId } = req.query;
    
    if (!collegeId) {
      return res.status(400).json({ error: 'collegeId is required' });
    }

    if (isFirebaseAvailable()) {
      const db = getFirestoreDb();
      const snapshot = await db.collection('departments')
        .where('collegeId', '==', collegeId)
        .get(); // Remove orderBy for now to avoid index requirement
      
      const departments = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .sort((a, b) => a.name.localeCompare(b.name)); // Sort client-side
      
      res.json(departments);
    } else {
      // Fallback to SQLite
      const db = getDatabase();
      db.all(
        'SELECT id, name FROM departments WHERE college_id = ? ORDER BY name ASC',
        [collegeId],
        (err, departments) => {
          db.close();
          
          if (err) {
            console.error('Error fetching departments:', err);
            return res.status(500).json({ error: 'Database error' });
          }

          res.json(departments);
        }
      );
    }
  } catch (error) {
    console.error('Error fetching departments:', error);
    res.status(500).json({ error: 'Failed to fetch departments' });
  }
});

// Get subjects by department
router.get('/subjects', async (req, res) => {
  try {
    const { departmentId } = req.query;
    
    if (!departmentId) {
      return res.status(400).json({ error: 'departmentId is required' });
    }

    if (isFirebaseAvailable()) {
      const db = getFirestoreDb();
      const snapshot = await db.collection('subjects')
        .where('departmentId', '==', departmentId)
        .get(); // Remove orderBy for now to avoid index requirement
      
      const subjects = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .sort((a, b) => a.name.localeCompare(b.name)); // Sort client-side
      
      res.json(subjects);
    } else {
      // Fallback to SQLite
      const db = getDatabase();
      db.all(
        'SELECT id, name FROM subjects WHERE department_id = ? ORDER BY name ASC',
        [departmentId],
        (err, subjects) => {
          db.close();
          
          if (err) {
            console.error('Error fetching subjects:', err);
            return res.status(500).json({ error: 'Database error' });
          }

          res.json(subjects);
        }
      );
    }
  } catch (error) {
    console.error('Error fetching subjects:', error);
    res.status(500).json({ error: 'Failed to fetch subjects' });
  }
});

// Search subjects by name and department
router.get('/subjects/search', async (req, res) => {
  try {
    const { q, departmentId } = req.query;
    
    if (!q || q.trim().length < 2) {
      return res.json([]);
    }

    if (isFirebaseAvailable()) {
      const db = getFirestoreDb();
      let query = db.collection('subjects');
      
      if (departmentId) {
        query = query.where('departmentId', '==', departmentId);
      }
      
      // Firestore doesn't support LIKE queries, so we'll do client-side filtering
      const snapshot = await query.orderBy('name', 'asc').limit(100).get();
      
      const searchTerm = q.trim().toLowerCase();
      const subjects = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(subject => subject.name.toLowerCase().includes(searchTerm))
        .slice(0, 20);
      
      res.json(subjects);
    } else {
      // Fallback to SQLite
      const db = getDatabase();
      let query = 'SELECT id, name FROM subjects WHERE name LIKE ?';
      let params = [`%${q.trim()}%`];

      if (departmentId) {
        query += ' AND department_id = ?';
        params.push(departmentId);
      }

      query += ' ORDER BY name ASC LIMIT 20';
      
      db.all(query, params, (err, subjects) => {
        db.close();
        
        if (err) {
          console.error('Error searching subjects:', err);
          return res.status(500).json({ error: 'Database error' });
        }

        res.json(subjects);
      });
    }
  } catch (error) {
    console.error('Error searching subjects:', error);
    res.status(500).json({ error: 'Failed to search subjects' });
  }
});

// Get academic hierarchy for a user (with names resolved)
router.get('/user-hierarchy/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (isFirebaseAvailable()) {
      const db = getFirestoreDb();
      
      // Get user document
      const userDoc = await db.collection('users').doc(userId).get();
      
      if (!userDoc.exists) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      const userData = userDoc.data();
      const result = {
        collegeId: userData.collegeId || null,
        collegeName: null,
        departmentId: userData.departmentId || null,
        departmentName: null,
        educationYear: userData.educationYear || null,
        semester: userData.semester || null
      };
      
      // Fetch college name if collegeId exists
      if (userData.collegeId) {
        const collegeDoc = await db.collection('colleges').doc(userData.collegeId).get();
        if (collegeDoc.exists) {
          result.collegeName = collegeDoc.data().name;
        }
      }
      
      // Fetch department name if departmentId exists
      if (userData.departmentId) {
        const departmentDoc = await db.collection('departments').doc(userData.departmentId).get();
        if (departmentDoc.exists) {
          result.departmentName = departmentDoc.data().name;
        }
      }
      
      res.json(result);
    } else {
      // Fallback to SQLite
      const db = getDatabase();
      const query = `
        SELECT 
          u.college_id,
          u.department_id,
          u.education_year,
          u.semester,
          c.name as college_name,
          d.name as department_name
        FROM users u
        LEFT JOIN colleges c ON u.college_id = c.id
        LEFT JOIN departments d ON u.department_id = d.id
        WHERE u.id = ?
      `;

      db.get(query, [userId], (err, result) => {
        db.close();
        
        if (err) {
          console.error('Error fetching user hierarchy:', err);
          return res.status(500).json({ error: 'Database error' });
        }

        if (!result) {
          return res.status(404).json({ error: 'User not found' });
        }

        res.json({
          collegeId: result.college_id,
          collegeName: result.college_name,
          departmentId: result.department_id,
          departmentName: result.department_name,
          educationYear: result.education_year,
          semester: result.semester
        });
      });
    }
  } catch (error) {
    console.error('Error fetching user hierarchy:', error);
    res.status(500).json({ error: 'Failed to fetch user hierarchy' });
  }
});

// Get note subjects with names
router.get('/note-subjects/:noteId', async (req, res) => {
  try {
    const { noteId } = req.params;
    
    if (isFirebaseAvailable()) {
      const db = getFirestoreDb();
      
      // Get note document to get subject IDs
      const noteDoc = await db.collection('notes').doc(noteId).get();
      
      if (!noteDoc.exists) {
        return res.status(404).json({ error: 'Note not found' });
      }
      
      const noteData = noteDoc.data();
      const subjectIds = noteData.subjectIds || [];
      
      if (subjectIds.length === 0) {
        return res.json([]);
      }
      
      // Fetch subject documents
      const subjects = [];
      const chunks = [];
      for (let i = 0; i < subjectIds.length; i += 10) {
        chunks.push(subjectIds.slice(i, i + 10));
      }
      
      for (const chunk of chunks) {
        const snapshot = await db.collection('subjects')
          .where('__name__', 'in', chunk)
          .get();
        
        subjects.push(...snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })));
      }
      
      // Sort by name
      subjects.sort((a, b) => a.name.localeCompare(b.name));
      
      res.json(subjects);
    } else {
      // Fallback to SQLite
      const db = getDatabase();
      const query = `
        SELECT s.id, s.name
        FROM note_subjects ns
        JOIN subjects s ON ns.subject_id = s.id
        WHERE ns.note_id = ?
        ORDER BY s.name ASC
      `;

      db.all(query, [noteId], (err, subjects) => {
        db.close();
        
        if (err) {
          console.error('Error fetching note subjects:', err);
          return res.status(500).json({ error: 'Database error' });
        }

        res.json(subjects);
      });
    }
  } catch (error) {
    console.error('Error fetching note subjects:', error);
    res.status(500).json({ error: 'Failed to fetch note subjects' });
  }
});

module.exports = router;