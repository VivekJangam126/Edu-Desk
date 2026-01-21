const fs = require('fs').promises;
const path = require('path');
const { getDatabase } = require('../database/init');
const { getFirestoreDb, isFirebaseAvailable } = require('./firebase');
const { uploadPDF, isR2Available } = require('./r2Storage');

/**
 * Migration service for transitioning from SQLite + Local Storage to Firestore + R2
 */

/**
 * Migrate academic data from SQLite to Firestore
 */
async function migrateAcademicData() {
  if (!isFirebaseAvailable()) {
    throw new Error('Firebase not available for migration');
  }

  console.log('Starting academic data migration from SQLite to Firestore...');
  
  const sqliteDb = getDatabase();
  const firestoreDb = getFirestoreDb();
  
  try {
    // Check if Firestore already has data
    const existingColleges = await firestoreDb.collection('colleges').limit(1).get();
    if (!existingColleges.empty) {
      console.log('Firestore already has academic data, skipping migration');
      return;
    }

    // Migrate colleges
    console.log('Migrating colleges...');
    const colleges = await new Promise((resolve, reject) => {
      sqliteDb.all('SELECT * FROM colleges ORDER BY id', [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    const collegeIdMap = {};
    for (const college of colleges) {
      const collegeRef = firestoreDb.collection('colleges').doc();
      await collegeRef.set({
        name: college.name,
        createdAt: new Date(college.created_at || Date.now())
      });
      collegeIdMap[college.id] = collegeRef.id;
    }
    console.log(`✓ Migrated ${colleges.length} colleges`);

    // Migrate departments
    console.log('Migrating departments...');
    const departments = await new Promise((resolve, reject) => {
      sqliteDb.all('SELECT * FROM departments ORDER BY id', [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    const departmentIdMap = {};
    for (const department of departments) {
      const deptRef = firestoreDb.collection('departments').doc();
      await deptRef.set({
        name: department.name,
        collegeId: collegeIdMap[department.college_id],
        createdAt: new Date(department.created_at || Date.now())
      });
      departmentIdMap[department.id] = deptRef.id;
    }
    console.log(`✓ Migrated ${departments.length} departments`);

    // Migrate subjects
    console.log('Migrating subjects...');
    const subjects = await new Promise((resolve, reject) => {
      sqliteDb.all('SELECT * FROM subjects ORDER BY id', [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    const subjectIdMap = {};
    for (const subject of subjects) {
      const subjectRef = firestoreDb.collection('subjects').doc();
      await subjectRef.set({
        name: subject.name,
        departmentId: departmentIdMap[subject.department_id],
        createdAt: new Date(subject.created_at || Date.now())
      });
      subjectIdMap[subject.id] = subjectRef.id;
    }
    console.log(`✓ Migrated ${subjects.length} subjects`);

    console.log('✅ Academic data migration completed successfully');
    return { collegeIdMap, departmentIdMap, subjectIdMap };

  } finally {
    sqliteDb.close();
  }
}

/**
 * Migrate user data from SQLite to Firestore
 */
async function migrateUserData() {
  if (!isFirebaseAvailable()) {
    throw new Error('Firebase not available for migration');
  }

  console.log('Starting user data migration from SQLite to Firestore...');
  
  const sqliteDb = getDatabase();
  const firestoreDb = getFirestoreDb();
  
  try {
    // Get academic name-to-ID mappings from Firestore
    const collegesSnapshot = await firestoreDb.collection('colleges').get();
    const departmentsSnapshot = await firestoreDb.collection('departments').get();
    
    const collegeNameToId = {};
    const departmentNameToId = {};
    
    collegesSnapshot.docs.forEach(doc => {
      collegeNameToId[doc.data().name] = doc.id;
    });
    
    departmentsSnapshot.docs.forEach(doc => {
      departmentNameToId[doc.data().name] = doc.id;
    });

    const users = await new Promise((resolve, reject) => {
      sqliteDb.all(`
        SELECT u.*, c.name as college_name, d.name as department_name
        FROM users u
        LEFT JOIN colleges c ON u.college_id = c.id
        LEFT JOIN departments d ON u.department_id = d.id
        ORDER BY u.id
      `, [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    const userIdMap = {};
    for (const user of users) {
      // Use the original user ID as the Firestore document ID for consistency
      const userRef = firestoreDb.collection('users').doc(user.id.toString());
      
      await userRef.set({
        email: user.email,
        name: user.name,
        password: user.password, // Keep encrypted password
        role: user.role || 'student',
        collegeId: user.college_name ? collegeNameToId[user.college_name] : null,
        departmentId: user.department_name ? departmentNameToId[user.department_name] : null,
        educationYear: user.education_year || null,
        semester: user.semester || null,
        createdAt: new Date(user.created_at || Date.now())
      });
      
      userIdMap[user.id] = user.id.toString(); // Keep same ID
    }
    
    console.log(`✓ Migrated ${users.length} users`);
    return userIdMap;

  } finally {
    sqliteDb.close();
  }
}

/**
 * Migrate notes data and files from SQLite + Local to Firestore + R2
 */
async function migrateNotesData() {
  if (!isFirebaseAvailable()) {
    throw new Error('Firebase not available for migration');
  }

  console.log('Starting notes data migration from SQLite to Firestore...');
  
  const sqliteDb = getDatabase();
  const firestoreDb = getFirestoreDb();
  
  try {
    // Get academic name-to-ID mappings from Firestore
    const collegesSnapshot = await firestoreDb.collection('colleges').get();
    const departmentsSnapshot = await firestoreDb.collection('departments').get();
    const subjectsSnapshot = await firestoreDb.collection('subjects').get();
    
    const collegeNameToId = {};
    const departmentNameToId = {};
    const subjectNameToId = {};
    
    collegesSnapshot.docs.forEach(doc => {
      collegeNameToId[doc.data().name] = doc.id;
    });
    
    departmentsSnapshot.docs.forEach(doc => {
      departmentNameToId[doc.data().name] = doc.id;
    });
    
    subjectsSnapshot.docs.forEach(doc => {
      subjectNameToId[doc.data().name] = doc.id;
    });

    const notes = await new Promise((resolve, reject) => {
      sqliteDb.all(`
        SELECT n.*, 
               c.name as college_name, 
               d.name as department_name,
               GROUP_CONCAT(s.name) as subject_names
        FROM notes n
        LEFT JOIN colleges c ON n.college_id = c.id
        LEFT JOIN departments d ON n.department_id = d.id
        LEFT JOIN note_subjects ns ON n.id = ns.note_id
        LEFT JOIN subjects s ON ns.subject_id = s.id
        GROUP BY n.id
        ORDER BY n.id
      `, [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    let migratedCount = 0;
    let filesMigratedToR2 = 0;

    for (const note of notes) {
      const noteRef = firestoreDb.collection('notes').doc();
      let fileUrl = note.file_url;
      let storageType = 'local';

      // Try to migrate file to R2 if available
      if (isR2Available() && note.file_url && note.file_url.startsWith('/uploads/')) {
        try {
          const localFilePath = path.join(__dirname, '../../uploads', path.basename(note.file_url));
          const fileBuffer = await fs.readFile(localFilePath);
          
          fileUrl = await uploadPDF(fileBuffer, noteRef.id, note.file_name);
          storageType = 'r2';
          filesMigratedToR2++;
          console.log(`✓ Migrated file to R2: ${note.file_name}`);
        } catch (error) {
          console.warn(`Failed to migrate file to R2: ${note.file_name}`, error.message);
          // Keep original local file URL
        }
      }

      // Process subject IDs using name mapping
      const subjectIds = note.subject_names ? 
        note.subject_names.split(',')
          .map(name => name.trim())
          .map(name => subjectNameToId[name])
          .filter(Boolean) : 
        [];

      await noteRef.set({
        title: note.title,
        description: note.description || '',
        fileName: note.file_name,
        fileUrl: fileUrl,
        storageType: storageType,
        uploadedBy: note.uploaded_by.toString(),
        collegeId: note.college_name ? collegeNameToId[note.college_name] : null,
        departmentId: note.department_name ? departmentNameToId[note.department_name] : null,
        educationYear: note.education_year || null,
        semester: note.semester || null,
        subjectIds: subjectIds,
        originalSqliteId: note.id, // Keep reference to original ID
        createdAt: new Date(note.created_at || Date.now())
      });

      migratedCount++;
    }

    console.log(`✓ Migrated ${migratedCount} notes`);
    console.log(`✓ Migrated ${filesMigratedToR2} files to R2 storage`);

    return { migratedCount, filesMigratedToR2 };

  } finally {
    sqliteDb.close();
  }
}

/**
 * Migrate comments and ratings
 */
async function migrateInteractions() {
  if (!isFirebaseAvailable()) {
    throw new Error('Firebase not available for migration');
  }

  console.log('Starting interactions migration (comments, ratings, favorites)...');
  
  const sqliteDb = getDatabase();
  const firestoreDb = getFirestoreDb();
  
  try {
    // Get note mappings from Firestore (using originalSqliteId)
    const notesSnapshot = await firestoreDb.collection('notes').get();
    const noteIdMap = {};
    
    notesSnapshot.docs.forEach(doc => {
      const data = doc.data();
      if (data.originalSqliteId) {
        noteIdMap[data.originalSqliteId] = doc.id;
      }
    });

    // Migrate comments
    const comments = await new Promise((resolve, reject) => {
      sqliteDb.all('SELECT * FROM comments ORDER BY id', [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    for (const comment of comments) {
      const commentRef = firestoreDb.collection('comments').doc();
      await commentRef.set({
        noteId: noteIdMap[comment.note_id] || comment.note_id.toString(),
        userId: comment.user_id.toString(),
        text: comment.text,
        createdAt: new Date(comment.created_at || Date.now())
      });
    }
    console.log(`✓ Migrated ${comments.length} comments`);

    // Migrate ratings
    const ratings = await new Promise((resolve, reject) => {
      sqliteDb.all('SELECT * FROM ratings ORDER BY id', [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    for (const rating of ratings) {
      const ratingRef = firestoreDb.collection('ratings').doc();
      await ratingRef.set({
        noteId: noteIdMap[rating.note_id] || rating.note_id.toString(),
        userId: rating.user_id.toString(),
        rating: rating.rating,
        createdAt: new Date(rating.created_at || Date.now())
      });
    }
    console.log(`✓ Migrated ${ratings.length} ratings`);

    // Migrate favorites
    const favorites = await new Promise((resolve, reject) => {
      sqliteDb.all('SELECT * FROM favorites ORDER BY id', [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    for (const favorite of favorites) {
      const favoriteRef = firestoreDb.collection('favorites').doc();
      await favoriteRef.set({
        noteId: noteIdMap[favorite.note_id] || favorite.note_id.toString(),
        userId: favorite.user_id.toString(),
        createdAt: new Date(favorite.created_at || Date.now())
      });
    }
    console.log(`✓ Migrated ${favorites.length} favorites`);

    return {
      comments: comments.length,
      ratings: ratings.length,
      favorites: favorites.length
    };

  } finally {
    sqliteDb.close();
  }
}

/**
 * Complete migration from SQLite + Local to Firestore + R2
 */
async function runFullMigration() {
  console.log('🚀 Starting full migration from SQLite + Local Storage to Firestore + R2...\n');
  
  try {
    // Step 1: Migrate academic data
    const academicResult = await migrateAcademicData();
    
    // Step 2: Migrate user data
    const userResult = await migrateUserData();
    
    // Step 3: Migrate notes and files
    const notesResult = await migrateNotesData();
    
    // Step 4: Migrate interactions
    const interactionsResult = await migrateInteractions();
    
    console.log('\n✅ Full migration completed successfully!');
    console.log('\n📊 Migration Summary:');
    console.log(`   - Academic data: ✅ Migrated`);
    console.log(`   - Users: ✅ Migrated`);
    console.log(`   - Notes: ✅ ${notesResult.migratedCount} migrated`);
    console.log(`   - Files to R2: ✅ ${notesResult.filesMigratedToR2} migrated`);
    console.log(`   - Comments: ✅ ${interactionsResult.comments} migrated`);
    console.log(`   - Ratings: ✅ ${interactionsResult.ratings} migrated`);
    console.log(`   - Favorites: ✅ ${interactionsResult.favorites} migrated`);
    
    return {
      success: true,
      academic: academicResult,
      users: userResult,
      notes: notesResult,
      interactions: interactionsResult
    };
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

/**
 * Helper functions to get ID mappings
 */
async function getIdMappings() {
  if (!isFirebaseAvailable()) {
    return { collegeIdMap: {}, departmentIdMap: {}, subjectIdMap: {} };
  }

  const firestoreDb = getFirestoreDb();
  const collegeIdMap = {};
  const departmentIdMap = {};
  const subjectIdMap = {};

  try {
    // Get college mappings by name
    const collegesSnapshot = await firestoreDb.collection('colleges').get();
    collegesSnapshot.docs.forEach(doc => {
      const data = doc.data();
      // Create reverse mapping: find SQLite ID by name
      collegeIdMap[data.name] = doc.id;
    });

    // Get department mappings by name
    const departmentsSnapshot = await firestoreDb.collection('departments').get();
    departmentsSnapshot.docs.forEach(doc => {
      const data = doc.data();
      departmentIdMap[data.name] = doc.id;
    });

    // Get subject mappings by name
    const subjectsSnapshot = await firestoreDb.collection('subjects').get();
    subjectsSnapshot.docs.forEach(doc => {
      const data = doc.data();
      subjectIdMap[data.name] = doc.id;
    });

    return { collegeIdMap, departmentIdMap, subjectIdMap };
  } catch (error) {
    console.error('Error getting ID mappings:', error);
    return { collegeIdMap: {}, departmentIdMap: {}, subjectIdMap: {} };
  }
}

async function getUserIdMap() {
  if (!isFirebaseAvailable()) {
    return {};
  }

  const firestoreDb = getFirestoreDb();
  const userIdMap = {};

  try {
    const usersSnapshot = await firestoreDb.collection('users').get();
    usersSnapshot.docs.forEach(doc => {
      // Map SQLite user ID to Firestore document ID
      userIdMap[parseInt(doc.id)] = doc.id;
    });

    return userIdMap;
  } catch (error) {
    console.error('Error getting user ID mappings:', error);
    return {};
  }
}

async function getNoteIdMap() {
  if (!isFirebaseAvailable()) {
    return {};
  }

  const firestoreDb = getFirestoreDb();
  const noteIdMap = {};

  try {
    const notesSnapshot = await firestoreDb.collection('notes').get();
    notesSnapshot.docs.forEach(doc => {
      // For notes, we'll use the Firestore document ID
      noteIdMap[doc.data().originalId || doc.id] = doc.id;
    });

    return noteIdMap;
  } catch (error) {
    console.error('Error getting note ID mappings:', error);
    return {};
  }
}

/**
 * Migrate individual file to R2
 */
async function migrateFileToR2(localFilePath, noteId, fileName) {
  if (!isR2Available()) {
    throw new Error('R2 not available for file migration');
  }

  try {
    const fileBuffer = await fs.readFile(localFilePath);
    const r2Url = await uploadPDF(fileBuffer, noteId, fileName);
    
    console.log(`✓ File migrated to R2: ${fileName}`);
    return r2Url;
  } catch (error) {
    console.error(`❌ Failed to migrate file: ${fileName}`, error);
    throw error;
  }
}

/**
 * Get migration status
 */
async function getMigrationStatus() {
  const status = {
    firebase: isFirebaseAvailable(),
    r2: isR2Available(),
    sqliteData: false,
    firestoreData: false,
    localFiles: 0,
    r2Files: 0
  };

  // Check SQLite data
  try {
    const sqliteDb = getDatabase();
    const noteCount = await new Promise((resolve, reject) => {
      sqliteDb.get('SELECT COUNT(*) as count FROM notes', [], (err, row) => {
        sqliteDb.close();
        if (err) reject(err);
        else resolve(row.count);
      });
    });
    status.sqliteData = noteCount > 0;
  } catch (error) {
    // SQLite might not be available
  }

  // Check Firestore data
  if (isFirebaseAvailable()) {
    try {
      const firestoreDb = getFirestoreDb();
      const notesSnapshot = await firestoreDb.collection('notes').limit(1).get();
      status.firestoreData = !notesSnapshot.empty;
    } catch (error) {
      // Firestore might not be accessible
    }
  }

  // Check local files
  try {
    const uploadsDir = path.join(__dirname, '../../uploads');
    const files = await fs.readdir(uploadsDir);
    status.localFiles = files.filter(file => file.endsWith('.pdf')).length;
  } catch (error) {
    // Uploads directory might not exist
  }

  return status;
}

module.exports = {
  migrateAcademicData,
  migrateUserData,
  migrateNotesData,
  migrateInteractions,
  runFullMigration,
  migrateFileToR2,
  getMigrationStatus
};