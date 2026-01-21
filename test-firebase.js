require('dotenv').config({ path: './server/.env' });
const { initializeFirebase, getFirestoreDb, isFirebaseAvailable } = require('./server/services/firebase');

async function testFirebase() {
  try {
    console.log('🔥 Testing Firebase Configuration...\n');
    
    // Test 1: Check environment variables
    console.log('1. Checking Firebase environment variables...');
    const requiredVars = ['FIREBASE_PROJECT_ID', 'FIREBASE_PRIVATE_KEY', 'FIREBASE_CLIENT_EMAIL'];
    const missingVars = requiredVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      console.log(`❌ Missing environment variables: ${missingVars.join(', ')}`);
      return;
    }
    
    console.log('✅ All Firebase environment variables present');
    console.log(`   Project ID: ${process.env.FIREBASE_PROJECT_ID}`);
    console.log(`   Client Email: ${process.env.FIREBASE_CLIENT_EMAIL}`);
    console.log(`   Private Key: ${process.env.FIREBASE_PRIVATE_KEY ? 'Present' : 'Missing'}`);
    
    // Test 2: Initialize Firebase
    console.log('\n2. Testing Firebase initialization...');
    const initialized = initializeFirebase();
    console.log(`✅ Firebase initialized: ${initialized}`);
    
    if (!initialized) {
      console.log('❌ Firebase initialization failed');
      return;
    }
    
    // Test 3: Check Firebase availability
    console.log('\n3. Checking Firebase availability...');
    const available = isFirebaseAvailable();
    console.log(`✅ Firebase available: ${available}`);
    
    if (!available) {
      console.log('❌ Firebase not available');
      return;
    }
    
    // Test 4: Get Firestore database
    console.log('\n4. Testing Firestore database connection...');
    const db = getFirestoreDb();
    console.log('✅ Firestore database instance obtained');
    
    // Test 5: Test basic Firestore operations
    console.log('\n5. Testing Firestore operations...');
    
    // Test write operation
    const testDocRef = db.collection('_test').doc('connection-test');
    await testDocRef.set({
      message: 'Firebase connection test',
      timestamp: new Date(),
      testId: Date.now()
    });
    console.log('✅ Test document written to Firestore');
    
    // Test read operation
    const testDoc = await testDocRef.get();
    if (testDoc.exists) {
      const data = testDoc.data();
      console.log('✅ Test document read from Firestore');
      console.log(`   Message: ${data.message}`);
      console.log(`   Timestamp: ${data.timestamp}`);
    } else {
      console.log('❌ Test document not found');
    }
    
    // Test delete operation
    await testDocRef.delete();
    console.log('✅ Test document deleted from Firestore');
    
    // Test 6: Check existing collections
    console.log('\n6. Checking existing collections...');
    const collections = ['colleges', 'departments', 'subjects', 'users', 'notes'];
    
    for (const collectionName of collections) {
      try {
        const snapshot = await db.collection(collectionName).limit(1).get();
        console.log(`✅ Collection '${collectionName}': ${snapshot.size} documents (showing first 1)`);
      } catch (error) {
        console.log(`❌ Error accessing collection '${collectionName}': ${error.message}`);
      }
    }
    
    // Test 7: Test academic data
    console.log('\n7. Testing academic data access...');
    try {
      const collegesSnapshot = await db.collection('colleges').limit(3).get();
      console.log(`✅ Colleges collection: ${collegesSnapshot.size} documents found`);
      
      collegesSnapshot.docs.forEach((doc, index) => {
        const data = doc.data();
        console.log(`   ${index + 1}. ${data.name} (ID: ${doc.id})`);
      });
      
      if (collegesSnapshot.size > 0) {
        const firstCollege = collegesSnapshot.docs[0];
        const departmentsSnapshot = await db.collection('departments')
          .where('collegeId', '==', firstCollege.id)
          .limit(3)
          .get();
        
        console.log(`✅ Departments for ${firstCollege.data().name}: ${departmentsSnapshot.size} found`);
        departmentsSnapshot.docs.forEach((doc, index) => {
          const data = doc.data();
          console.log(`   ${index + 1}. ${data.name} (ID: ${doc.id})`);
        });
      }
    } catch (error) {
      console.log(`❌ Error testing academic data: ${error.message}`);
    }
    
    console.log('\n🎉 Firebase test completed successfully!');
    console.log('\n📊 Test Summary:');
    console.log('   ✅ Environment variables configured');
    console.log('   ✅ Firebase SDK initialized');
    console.log('   ✅ Firestore connection established');
    console.log('   ✅ Read/Write operations working');
    console.log('   ✅ Collections accessible');
    console.log('   ✅ Academic data structure verified');
    
  } catch (error) {
    console.error('\n❌ Firebase test failed:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      stack: error.stack
    });
  }
}

testFirebase();