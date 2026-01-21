const express = require('express');
const multer = require('multer');
const path = require('path');
const { body, validationResult } = require('express-validator');
const { getDatabase } = require('../database/init');
const { authenticateToken } = require('../middleware/auth');
const { getFirestoreDb, isFirebaseAvailable } = require('../services/firebase');
const { uploadPDF, deletePDF, isR2Available } = require('../services/r2Storage');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'));
    }
  }
});

// Get all notes with filtering
router.get('/', async (req, res) => {
  try {
    const { 
      collegeId, 
      departmentId, 
      educationYear, 
      semester, 
      subjectIds, 
      recommended 
    } = req.query;

    if (isFirebaseAvailable()) {
      // Use Firestore
      const db = getFirestoreDb();
      let query = db.collection('notes');
      
      // Apply filters
      if (collegeId) {
        query = query.where('collegeId', '==', collegeId);
      }
      if (departmentId) {
        query = query.where('departmentId', '==', departmentId);
      }
      if (educationYear) {
        query = query.where('educationYear', '==', parseInt(educationYear));
      }
      if (semester) {
        query = query.where('semester', '==', parseInt(semester));
      }
      if (subjectIds && Array.isArray(subjectIds) && subjectIds.length > 0) {
        // Firestore array-contains-any for subject filtering
        query = query.where('subjectIds', 'array-contains-any', subjectIds);
      }
      
      const snapshot = await query.get(); // Remove orderBy to avoid index issues
      const notes = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)); // Sort client-side
      
      res.json(notes);
    } else {
      // Fallback to SQLite
      const db = getDatabase();
      
      let query = `
        SELECT 
          n.*,
          u.name as uploader_name,
          c.name as college_name,
          d.name as department_name,
          COALESCE(AVG(r.rating), 0) as avg_rating,
          COUNT(DISTINCT r.id) as rating_count,
          COUNT(DISTINCT cm.id) as comment_count
        FROM notes n
        LEFT JOIN users u ON n.uploaded_by = u.id
        LEFT JOIN colleges c ON n.college_id = c.id
        LEFT JOIN departments d ON n.department_id = d.id
        LEFT JOIN ratings r ON n.id = r.note_id
        LEFT JOIN comments cm ON n.id = cm.note_id
      `;

      const conditions = [];
      const params = [];

      // Manual filters using IDs
      if (collegeId) {
        conditions.push('n.college_id = ?');
        params.push(parseInt(collegeId));
      }
      if (departmentId) {
        conditions.push('n.department_id = ?');
        params.push(parseInt(departmentId));
      }
      if (educationYear) {
        conditions.push('n.education_year = ?');
        params.push(parseInt(educationYear));
      }
      if (semester) {
        conditions.push('n.semester = ?');
        params.push(parseInt(semester));
      }
      
      // Handle subject filtering with junction table
      if (subjectIds && Array.isArray(subjectIds) && subjectIds.length > 0) {
        const subjectPlaceholders = subjectIds.map(() => '?').join(',');
        query += ` LEFT JOIN note_subjects ns ON n.id = ns.note_id`;
        conditions.push(`ns.subject_id IN (${subjectPlaceholders})`);
        params.push(...subjectIds.map(id => parseInt(id)));
      }

      if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
      }

      query += `
        GROUP BY n.id
        ORDER BY n.created_at DESC
      `;

      db.all(query, params, (err, notes) => {
        db.close();
        
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({ error: 'Database error' });
        }

        res.json(notes);
      });
    }
  } catch (error) {
    console.error('Error fetching notes:', error);
    res.status(500).json({ error: 'Failed to fetch notes' });
  }
});

// Get single note with details
router.get('/:id', async (req, res) => {
  try {
    const noteId = req.params.id;

    if (isFirebaseAvailable()) {
      // Use Firestore
      const db = getFirestoreDb();
      
      const noteDoc = await db.collection('notes').doc(noteId).get();
      
      if (!noteDoc.exists) {
        return res.status(404).json({ error: 'Note not found' });
      }
      
      const noteData = { id: noteDoc.id, ...noteDoc.data() };
      
      // Get comments
      const commentsSnapshot = await db.collection('comments')
        .where('noteId', '==', noteId)
        .get(); // Remove orderBy to avoid index issues
      
      const comments = commentsSnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)); // Sort client-side
      
      res.json({ ...noteData, comments });
    } else {
      // Fallback to SQLite
      const db = getDatabase();

      const noteQuery = `
        SELECT 
          n.*,
          u.name as uploader_name,
          c.name as college_name,
          d.name as department_name,
          COALESCE(AVG(r.rating), 0) as avg_rating,
          COUNT(DISTINCT r.id) as rating_count
        FROM notes n
        LEFT JOIN users u ON n.uploaded_by = u.id
        LEFT JOIN colleges c ON n.college_id = c.id
        LEFT JOIN departments d ON n.department_id = d.id
        LEFT JOIN ratings r ON n.id = r.note_id
        WHERE n.id = ?
        GROUP BY n.id
      `;

      db.get(noteQuery, [noteId], (err, note) => {
        if (err || !note) {
          db.close();
          return res.status(404).json({ error: 'Note not found' });
        }

        // Get subjects for this note
        const subjectsQuery = `
          SELECT s.id, s.name
          FROM note_subjects ns
          JOIN subjects s ON ns.subject_id = s.id
          WHERE ns.note_id = ?
          ORDER BY s.name ASC
        `;

        db.all(subjectsQuery, [noteId], (err, subjects) => {
          if (err) {
            db.close();
            return res.status(500).json({ error: 'Database error' });
          }

          // Get comments
          const commentsQuery = `
            SELECT c.*, u.name as user_name
            FROM comments c
            LEFT JOIN users u ON c.user_id = u.id
            WHERE c.note_id = ?
            ORDER BY c.created_at DESC
          `;

          db.all(commentsQuery, [noteId], (err, comments) => {
            db.close();
            
            if (err) {
              return res.status(500).json({ error: 'Database error' });
            }

            res.json({ 
              ...note, 
              subjects: subjects,
              comments: comments 
            });
          });
        });
      });
    }
  } catch (error) {
    console.error('Error fetching note:', error);
    res.status(500).json({ error: 'Failed to fetch note' });
  }
});

// Upload note
router.post('/', authenticateToken, upload.single('file'), [
  body('title').trim().isLength({ min: 1, max: 200 }),
  body('description').optional().trim().isLength({ max: 1000 }),
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

    if (!req.file) {
      return res.status(400).json({ error: 'PDF file is required' });
    }

    const { 
      title, 
      description, 
      collegeId, 
      departmentId, 
      educationYear, 
      semester
    } = req.body;
    
    // Handle subjectIds array - check multiple possible formats
    let subjectIds = [];
    
    // Check for different possible formats
    if (req.body['subjectIds[]']) {
      subjectIds = Array.isArray(req.body['subjectIds[]']) ? req.body['subjectIds[]'] : [req.body['subjectIds[]']];
    } else if (req.body.subjectIds) {
      subjectIds = Array.isArray(req.body.subjectIds) ? req.body.subjectIds : [req.body.subjectIds];
    } else if (req.body['subjectIds']) {
      subjectIds = Array.isArray(req.body['subjectIds']) ? req.body['subjectIds'] : [req.body['subjectIds']];
    }

    let fileUrl;
    let noteId;
    let storageType = 'local'; // Track storage type for migration

    if (isFirebaseAvailable()) {
      // Use Firestore + R2
      const db = getFirestoreDb();
      const noteRef = db.collection('notes').doc();
      noteId = noteRef.id;
      
      // Try R2 first, fallback to local storage
      if (isR2Available()) {
        try {
          const fs = require('fs');
          const fileBuffer = fs.readFileSync(req.file.path);
          fileUrl = await uploadPDF(fileBuffer, noteId, req.file.originalname);
          storageType = 'r2';
          console.log(`✓ File uploaded to R2: ${noteId}`);
          
          // Clean up local file after successful R2 upload
          try {
            fs.unlinkSync(req.file.path);
          } catch (cleanupError) {
            console.warn('Failed to cleanup local file:', cleanupError.message);
          }
        } catch (error) {
          console.error('R2 upload failed, using local storage:', error.message);
          fileUrl = `/uploads/${req.file.filename}`;
          storageType = 'local';
        }
      } else {
        fileUrl = `/uploads/${req.file.filename}`;
        storageType = 'local';
      }
      
      // Save note metadata to Firestore
      await noteRef.set({
        title: title,
        description: description || '',
        fileName: req.file.originalname,
        fileUrl: fileUrl,
        storageType: storageType, // Track where file is stored
        uploadedBy: req.user.id,
        collegeId: collegeId || null,
        departmentId: departmentId || null,
        educationYear: educationYear ? parseInt(educationYear) : null,
        semester: semester ? parseInt(semester) : null,
        subjectIds: subjectIds,
        createdAt: new Date()
      });
      
      res.status(201).json({
        message: 'Note uploaded successfully',
        noteId: noteId,
        storageType: storageType
      });
    } else {
      // Fallback to SQLite + local storage
      const db = getDatabase();
      
      fileUrl = `/uploads/${req.file.filename}`;
      
      // Insert note
      db.run(
        `INSERT INTO notes (
          title, description, file_url, file_name, uploaded_by,
          college_id, department_id, education_year, semester
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          title, 
          description || '', 
          fileUrl, 
          req.file.originalname, 
          req.user.id,
          collegeId || null,
          departmentId || null,
          educationYear ? parseInt(educationYear) : null,
          semester ? parseInt(semester) : null
        ],
        function(err) {
          if (err) {
            db.close();
            return res.status(500).json({ error: 'Failed to save note' });
          }

          noteId = this.lastID;

          // Insert subjects into junction table
          if (subjectIds.length > 0) {
            const subjectInserts = subjectIds.map(subjectId => 
              `(${noteId}, ${parseInt(subjectId)})`
            ).join(',');
            
            db.run(
              `INSERT INTO note_subjects (note_id, subject_id) VALUES ${subjectInserts}`,
              [],
              function(err) {
                db.close();
                if (err) {
                  console.error('Error inserting subjects:', err);
                  return res.status(500).json({ error: 'Failed to save note subjects' });
                }
                
                res.status(201).json({
                  message: 'Note uploaded successfully',
                  noteId: noteId,
                  storageType: 'local'
                });
              }
            );
          } else {
            db.close();
            res.status(201).json({
              message: 'Note uploaded successfully',
              noteId: noteId,
              storageType: 'local'
            });
          }
        }
      );
    }
  } catch (error) {
    console.error('Error uploading note:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Add comment
router.post('/:id/comments', authenticateToken, [
  body('text').trim().isLength({ min: 1, max: 500 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const noteId = req.params.id;
    const { text } = req.body;

    if (isFirebaseAvailable()) {
      // Use Firestore
      const db = getFirestoreDb();
      const commentRef = db.collection('comments').doc();
      
      await commentRef.set({
        noteId: noteId,
        userId: req.user.id,
        text: text,
        createdAt: new Date()
      });
      
      res.status(201).json({
        message: 'Comment added successfully',
        commentId: commentRef.id
      });
    } else {
      // Fallback to SQLite
      const db = getDatabase();

      db.run(
        'INSERT INTO comments (note_id, user_id, text) VALUES (?, ?, ?)',
        [noteId, req.user.id, text],
        function(err) {
          db.close();
          
          if (err) {
            return res.status(500).json({ error: 'Failed to add comment' });
          }

          res.status(201).json({
            message: 'Comment added successfully',
            commentId: this.lastID
          });
        }
      );
    }
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({ error: 'Failed to add comment' });
  }
});

// Add/update rating
router.post('/:id/rating', authenticateToken, [
  body('rating').isInt({ min: 1, max: 5 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const noteId = req.params.id;
    const { rating } = req.body;

    if (isFirebaseAvailable()) {
      // Use Firestore
      const db = getFirestoreDb();
      
      // Check if rating already exists
      const existingRating = await db.collection('ratings')
        .where('noteId', '==', noteId)
        .where('userId', '==', req.user.id)
        .get();
      
      if (!existingRating.empty) {
        // Update existing rating
        const ratingDoc = existingRating.docs[0];
        await ratingDoc.ref.update({ rating: rating });
      } else {
        // Create new rating
        const ratingRef = db.collection('ratings').doc();
        await ratingRef.set({
          noteId: noteId,
          userId: req.user.id,
          rating: rating,
          createdAt: new Date()
        });
      }
      
      res.json({ message: 'Rating added successfully' });
    } else {
      // Fallback to SQLite
      const db = getDatabase();

      db.run(
        'INSERT OR REPLACE INTO ratings (note_id, user_id, rating) VALUES (?, ?, ?)',
        [noteId, req.user.id, rating],
        function(err) {
          db.close();
          
          if (err) {
            return res.status(500).json({ error: 'Failed to add rating' });
          }

          res.json({ message: 'Rating added successfully' });
        }
      );
    }
  } catch (error) {
    console.error('Error adding rating:', error);
    res.status(500).json({ error: 'Failed to add rating' });
  }
});

// Toggle favorite
router.post('/:id/favorite', authenticateToken, async (req, res) => {
  try {
    const noteId = req.params.id;

    if (isFirebaseAvailable()) {
      // Use Firestore
      const db = getFirestoreDb();
      
      // Check if already favorited
      const existingFavorite = await db.collection('favorites')
        .where('noteId', '==', noteId)
        .where('userId', '==', req.user.id)
        .get();
      
      if (!existingFavorite.empty) {
        // Remove favorite
        await existingFavorite.docs[0].ref.delete();
        res.json({ message: 'Removed from favorites', favorited: false });
      } else {
        // Add favorite
        const favoriteRef = db.collection('favorites').doc();
        await favoriteRef.set({
          noteId: noteId,
          userId: req.user.id,
          createdAt: new Date()
        });
        res.json({ message: 'Added to favorites', favorited: true });
      }
    } else {
      // Fallback to SQLite
      const db = getDatabase();

      // Check if already favorited
      db.get(
        'SELECT id FROM favorites WHERE user_id = ? AND note_id = ?',
        [req.user.id, noteId],
        (err, existing) => {
          if (err) {
            db.close();
            return res.status(500).json({ error: 'Database error' });
          }

          if (existing) {
            // Remove favorite
            db.run(
              'DELETE FROM favorites WHERE user_id = ? AND note_id = ?',
              [req.user.id, noteId],
              (err) => {
                db.close();
                if (err) {
                  return res.status(500).json({ error: 'Failed to remove favorite' });
                }
                res.json({ message: 'Removed from favorites', favorited: false });
              }
            );
          } else {
            // Add favorite
            db.run(
              'INSERT INTO favorites (user_id, note_id) VALUES (?, ?)',
              [req.user.id, noteId],
              (err) => {
                db.close();
                if (err) {
                  return res.status(500).json({ error: 'Failed to add favorite' });
                }
                res.json({ message: 'Added to favorites', favorited: true });
              }
            );
          }
        }
      );
    }
  } catch (error) {
    console.error('Error toggling favorite:', error);
    res.status(500).json({ error: 'Failed to toggle favorite' });
  }
});

module.exports = router;