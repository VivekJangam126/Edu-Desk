const express = require('express');
const { body, validationResult } = require('express-validator');
const { getDatabase } = require('../database/init');
const { authenticateToken } = require('../middleware/auth');
const { getFirestoreDb, isFirebaseAvailable } = require('../services/firebase');

const router = express.Router();

// Get user profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    if (isFirebaseAvailable()) {
      // Use Firestore
      const db = getFirestoreDb();
      const userDoc = await db.collection('users').doc(req.user.id).get();
      
      if (!userDoc.exists) {
        return res.status(404).json({ error: 'Profile not found' });
      }
      
      const userData = userDoc.data();
      
      // Get academic names if IDs are present
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
      
      // Get user stats
      const [notesSnapshot, favoritesSnapshot, commentsSnapshot] = await Promise.all([
        db.collection('notes').where('uploadedBy', '==', req.user.id).get(),
        db.collection('favorites').where('userId', '==', req.user.id).get(),
        db.collection('comments').where('userId', '==', req.user.id).get()
      ]);
      
      const profile = {
        id: userDoc.id,
        email: userData.email,
        name: userData.name,
        role: userData.role || 'student',
        collegeId: userData.collegeId,
        departmentId: userData.departmentId,
        educationYear: userData.educationYear,
        semester: userData.semester,
        collegeName: collegeName,
        departmentName: departmentName,
        total_uploads: notesSnapshot.size,
        total_favorites: favoritesSnapshot.size,
        total_comments: commentsSnapshot.size,
        createdAt: userData.createdAt
      };
      
      res.json(profile);
    } else {
      // Fallback to SQLite
      const db = getDatabase();
      
      const query = `
        SELECT 
          u.id,
          u.email,
          u.name,
          u.role,
          u.college_id,
          u.department_id,
          u.education_year,
          u.semester,
          u.created_at,
          c.name as collegeName,
          d.name as departmentName,
          COUNT(DISTINCT n.id) as total_uploads,
          COUNT(DISTINCT f.id) as total_favorites,
          COUNT(DISTINCT cm.id) as total_comments
        FROM users u
        LEFT JOIN colleges c ON u.college_id = c.id
        LEFT JOIN departments d ON u.department_id = d.id
        LEFT JOIN notes n ON u.id = n.uploaded_by
        LEFT JOIN favorites f ON u.id = f.user_id
        LEFT JOIN comments cm ON u.id = cm.user_id
        WHERE u.id = ?
        GROUP BY u.id
      `;

      db.get(query, [req.user.id], (err, profile) => {
        db.close();
        
        if (err || !profile) {
          return res.status(404).json({ error: 'Profile not found' });
        }

        // Format response
        const formattedProfile = {
          ...profile,
          collegeId: profile.college_id,
          departmentId: profile.department_id,
          educationYear: profile.education_year,
          role: profile.role || 'student'
        };
        delete formattedProfile.college_id;
        delete formattedProfile.department_id;
        delete formattedProfile.education_year;

        res.json(formattedProfile);
      });
    }
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Update user profile
router.put('/profile', authenticateToken, [
  body('name').optional().trim().isLength({ min: 2, max: 50 }),
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

    const { name, role, collegeId, departmentId, educationYear, semester } = req.body;

    if (isFirebaseAvailable()) {
      // Use Firestore
      const db = getFirestoreDb();
      const userRef = db.collection('users').doc(req.user.id);
      
      const updateData = {};
      if (name !== undefined) updateData.name = name;
      if (role !== undefined) updateData.role = role;
      if (collegeId !== undefined) updateData.collegeId = collegeId || null;
      if (departmentId !== undefined) updateData.departmentId = departmentId || null;
      if (educationYear !== undefined) updateData.educationYear = educationYear || null;
      if (semester !== undefined) updateData.semester = semester || null;

      if (Object.keys(updateData).length === 0) {
        return res.status(400).json({ error: 'No fields to update' });
      }

      await userRef.update(updateData);
      res.json({ message: 'Profile updated successfully' });
    } else {
      // Fallback to SQLite
      const db = getDatabase();

      // Build dynamic update query
      const updates = [];
      const params = [];

      if (name !== undefined) {
        updates.push('name = ?');
        params.push(name);
      }
      if (role !== undefined) {
        updates.push('role = ?');
        params.push(role);
      }
      if (collegeId !== undefined) {
        updates.push('college_id = ?');
        params.push(collegeId || null);
      }
      if (departmentId !== undefined) {
        updates.push('department_id = ?');
        params.push(departmentId || null);
      }
      if (educationYear !== undefined) {
        updates.push('education_year = ?');
        params.push(educationYear || null);
      }
      if (semester !== undefined) {
        updates.push('semester = ?');
        params.push(semester || null);
      }

      if (updates.length === 0) {
        return res.status(400).json({ error: 'No fields to update' });
      }

      params.push(req.user.id);

      const query = `UPDATE users SET ${updates.join(', ')} WHERE id = ?`;

      db.run(query, params, function(err) {
        db.close();
        
        if (err) {
          return res.status(500).json({ error: 'Failed to update profile' });
        }

        res.json({ message: 'Profile updated successfully' });
      });
    }
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Get user's uploads
router.get('/uploads', authenticateToken, async (req, res) => {
  try {
    if (isFirebaseAvailable()) {
      // Use Firestore
      const db = getFirestoreDb();
      
      const notesSnapshot = await db.collection('notes')
        .where('uploadedBy', '==', req.user.id)
        .get(); // Remove orderBy to avoid index issues
      
      const notes = [];
      for (const doc of notesSnapshot.docs) {
        const noteData = { id: doc.id, ...doc.data() };
        
        // Get ratings and comments count
        const [ratingsSnapshot, commentsSnapshot] = await Promise.all([
          db.collection('ratings').where('noteId', '==', doc.id).get(),
          db.collection('comments').where('noteId', '==', doc.id).get()
        ]);
        
        // Calculate average rating
        let avgRating = 0;
        if (ratingsSnapshot.size > 0) {
          const totalRating = ratingsSnapshot.docs.reduce((sum, ratingDoc) => {
            return sum + ratingDoc.data().rating;
          }, 0);
          avgRating = totalRating / ratingsSnapshot.size;
        }
        
        noteData.avg_rating = avgRating;
        noteData.rating_count = ratingsSnapshot.size;
        noteData.comment_count = commentsSnapshot.size;
        
        notes.push(noteData);
      }
      
      // Sort client-side by creation date
      notes.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      
      res.json(notes);
    } else {
      // Fallback to SQLite
      const db = getDatabase();
      
      const query = `
        SELECT 
          n.*,
          COALESCE(AVG(r.rating), 0) as avg_rating,
          COUNT(DISTINCT r.id) as rating_count,
          COUNT(DISTINCT c.id) as comment_count
        FROM notes n
        LEFT JOIN ratings r ON n.id = r.note_id
        LEFT JOIN comments c ON n.id = c.note_id
        WHERE n.uploaded_by = ?
        GROUP BY n.id
        ORDER BY n.created_at DESC
      `;

      db.all(query, [req.user.id], (err, uploads) => {
        db.close();
        
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }

        res.json(uploads);
      });
    }
  } catch (error) {
    console.error('Error fetching uploads:', error);
    res.status(500).json({ error: 'Failed to fetch uploads' });
  }
});

// Get user's favorites
router.get('/favorites', authenticateToken, async (req, res) => {
  try {
    if (isFirebaseAvailable()) {
      // Use Firestore
      const db = getFirestoreDb();
      
      const favoritesSnapshot = await db.collection('favorites')
        .where('userId', '==', req.user.id)
        .get();
      
      const favorites = [];
      for (const favoriteDoc of favoritesSnapshot.docs) {
        const favoriteData = favoriteDoc.data();
        
        // Get the note details
        const noteDoc = await db.collection('notes').doc(favoriteData.noteId).get();
        if (!noteDoc.exists) continue;
        
        const noteData = { id: noteDoc.id, ...noteDoc.data() };
        
        // Get uploader name
        const uploaderDoc = await db.collection('users').doc(noteData.uploadedBy).get();
        if (uploaderDoc.exists) {
          noteData.uploader_name = uploaderDoc.data().name;
        }
        
        // Get ratings and comments count
        const [ratingsSnapshot, commentsSnapshot] = await Promise.all([
          db.collection('ratings').where('noteId', '==', noteDoc.id).get(),
          db.collection('comments').where('noteId', '==', noteDoc.id).get()
        ]);
        
        // Calculate average rating
        let avgRating = 0;
        if (ratingsSnapshot.size > 0) {
          const totalRating = ratingsSnapshot.docs.reduce((sum, ratingDoc) => {
            return sum + ratingDoc.data().rating;
          }, 0);
          avgRating = totalRating / ratingsSnapshot.size;
        }
        
        noteData.avg_rating = avgRating;
        noteData.rating_count = ratingsSnapshot.size;
        noteData.comment_count = commentsSnapshot.size;
        noteData.favorited_at = favoriteData.createdAt;
        
        favorites.push(noteData);
      }
      
      // Sort by favorite date
      favorites.sort((a, b) => new Date(b.favorited_at) - new Date(a.favorited_at));
      
      res.json(favorites);
    } else {
      // Fallback to SQLite
      const db = getDatabase();
      
      const query = `
        SELECT 
          n.*,
          u.name as uploader_name,
          COALESCE(AVG(r.rating), 0) as avg_rating,
          COUNT(DISTINCT r.id) as rating_count,
          COUNT(DISTINCT c.id) as comment_count
        FROM favorites f
        JOIN notes n ON f.note_id = n.id
        LEFT JOIN users u ON n.uploaded_by = u.id
        LEFT JOIN ratings r ON n.id = r.note_id
        LEFT JOIN comments c ON n.id = c.note_id
        WHERE f.user_id = ?
        GROUP BY n.id
        ORDER BY f.created_at DESC
      `;

      db.all(query, [req.user.id], (err, favorites) => {
        db.close();
        
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }

        res.json(favorites);
      });
    }
  } catch (error) {
    console.error('Error fetching favorites:', error);
    res.status(500).json({ error: 'Failed to fetch favorites' });
  }
});

// Get dashboard analytics
router.get('/analytics', authenticateToken, async (req, res) => {
  try {
    if (isFirebaseAvailable()) {
      // Use Firestore
      const db = getFirestoreDb();
      
      // Get basic stats
      const [allNotesSnapshot, userNotesSnapshot, userFavoritesSnapshot, userCommentsSnapshot] = await Promise.all([
        db.collection('notes').get(),
        db.collection('notes').where('uploadedBy', '==', req.user.id).get(),
        db.collection('favorites').where('userId', '==', req.user.id).get(),
        db.collection('comments').where('userId', '==', req.user.id).get()
      ]);
      
      const stats = {
        total_notes: allNotesSnapshot.size,
        user_uploads: userNotesSnapshot.size,
        user_favorites: userFavoritesSnapshot.size,
        user_comments: userCommentsSnapshot.size
      };
      
      // Get recent activity
      const activity = [];
      
      // Add recent uploads
      const recentUploads = userNotesSnapshot.docs
        .map(doc => ({
          type: 'upload',
          title: doc.data().title,
          date: doc.data().createdAt
        }))
        .slice(0, 5);
      
      activity.push(...recentUploads);
      
      // Add recent comments
      const recentComments = [];
      for (const commentDoc of userCommentsSnapshot.docs.slice(0, 5)) {
        const commentData = commentDoc.data();
        const noteDoc = await db.collection('notes').doc(commentData.noteId).get();
        if (noteDoc.exists) {
          recentComments.push({
            type: 'comment',
            title: `Comment on: ${noteDoc.data().title}`,
            date: commentData.createdAt
          });
        }
      }
      
      activity.push(...recentComments);
      
      // Sort by date and limit to 10
      activity.sort((a, b) => new Date(b.date) - new Date(a.date));
      activity.splice(10);
      
      res.json({ stats, activity });
    } else {
      // Fallback to SQLite
      const db = getDatabase();
      
      // Get basic stats
      const statsQuery = `
        SELECT 
          (SELECT COUNT(*) FROM notes) as total_notes,
          (SELECT COUNT(*) FROM notes WHERE uploaded_by = ?) as user_uploads,
          (SELECT COUNT(*) FROM favorites WHERE user_id = ?) as user_favorites,
          (SELECT COUNT(*) FROM comments WHERE user_id = ?) as user_comments
      `;

      db.get(statsQuery, [req.user.id, req.user.id, req.user.id], (err, stats) => {
        if (err) {
          db.close();
          return res.status(500).json({ error: 'Database error' });
        }

        // Get recent activity
        const activityQuery = `
          SELECT 
            'upload' as type,
            n.title as title,
            n.created_at as date
          FROM notes n
          WHERE n.uploaded_by = ?
          UNION ALL
          SELECT 
            'comment' as type,
            'Comment on: ' || n.title as title,
            c.created_at as date
          FROM comments c
          JOIN notes n ON c.note_id = n.id
          WHERE c.user_id = ?
          ORDER BY date DESC
          LIMIT 10
        `;

        db.all(activityQuery, [req.user.id, req.user.id], (err, activity) => {
          db.close();
          
          if (err) {
            return res.status(500).json({ error: 'Database error' });
          }

          res.json({ stats, activity });
        });
      });
    }
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

// Get filter options for notes
router.get('/filter-options', (req, res) => {
  const db = getDatabase();
  
  const query = `
    SELECT DISTINCT
      college,
      department,
      education_year,
      semester,
      subjects
    FROM notes 
    WHERE college IS NOT NULL 
       OR department IS NOT NULL 
       OR education_year IS NOT NULL 
       OR semester IS NOT NULL
       OR subjects IS NOT NULL
  `;

  db.all(query, [], (err, results) => {
    db.close();
    
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    // Process results to create filter options
    const colleges = new Set();
    const departments = new Set();
    const educationYears = new Set();
    const semesters = new Set();
    const subjects = new Set();

    results.forEach(row => {
      if (row.college) colleges.add(row.college);
      if (row.department) departments.add(row.department);
      if (row.education_year) educationYears.add(row.education_year);
      if (row.semester) semesters.add(row.semester);
      if (row.subjects) {
        row.subjects.split(',').forEach(subject => {
          subjects.add(subject.trim());
        });
      }
    });

    res.json({
      colleges: Array.from(colleges).sort(),
      departments: Array.from(departments).sort(),
      educationYears: Array.from(educationYears).sort((a, b) => a - b),
      semesters: Array.from(semesters).sort((a, b) => a - b),
      subjects: Array.from(subjects).sort()
    });
  });
});

module.exports = router;