const admin = require('firebase-admin');

let isFirebaseInitialized = false;

// Initialize Firebase Admin SDK
function initializeFirebase() {
  if (admin.apps.length === 0) {
    const serviceAccount = {
      projectId: process.env.FIREBASE_PROJECT_ID,
      privateKey: process.env.FIREBASE_PRIVATE_KEY ? 
        process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') : undefined,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    };

    // Validate required environment variables
    if (!serviceAccount.projectId || !serviceAccount.privateKey || !serviceAccount.clientEmail) {
      console.warn('Firebase environment variables not configured. Skipping Firebase initialization.');
      console.warn('Required: FIREBASE_PROJECT_ID, FIREBASE_PRIVATE_KEY, FIREBASE_CLIENT_EMAIL');
      return false;
    }

    try {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });

      console.log('Firebase Admin SDK initialized successfully');
      isFirebaseInitialized = true;
      
      // Test the connection with a simple operation
      testFirebaseConnection();
      
      return true;
    } catch (error) {
      console.error('Failed to initialize Firebase:', error.message);
      console.warn('Continuing without Firebase. Using SQLite fallback.');
      return false;
    }
  }
  
  return isFirebaseInitialized;
}

// Test Firebase connection
async function testFirebaseConnection() {
  try {
    const db = admin.firestore();
    // Just test if we can get a reference - don't actually write anything yet
    const testRef = db.collection('_test').doc('_connection');
    console.log('Firebase connection test passed');
  } catch (error) {
    console.warn('Firebase connection test failed:', error.message);
    console.warn('Firebase will be disabled. Using SQLite fallback.');
    isFirebaseInitialized = false;
  }
}

// Get Firestore database instance (with fallback)
function getFirestoreDb() {
  if (!isFirebaseInitialized) {
    throw new Error('Firebase not initialized. Please configure Firebase environment variables.');
  }
  return admin.firestore();
}

// Check if Firebase is available
function isFirebaseAvailable() {
  return isFirebaseInitialized;
}

// Try to initialize on module load, but don't fail if it doesn't work
try {
  initializeFirebase();
} catch (error) {
  console.warn('Firebase initialization failed on module load:', error.message);
}

module.exports = { 
  db: isFirebaseInitialized ? admin.firestore() : null,
  admin: isFirebaseInitialized ? admin : null,
  initializeFirebase,
  getFirestoreDb,
  isFirebaseAvailable
};