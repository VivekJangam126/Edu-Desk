require('dotenv').config({ path: './server/.env' });
const { getFirestoreDb } = require('./server/services/firebase');

async function testFirestoreNote() {
  try {
    console.log('🔍 Testing Firestore Note Data...\n');
    
    const db = getFirestoreDb();
    
    // Get all notes
    const notesSnapshot = await db.collection('notes').get();
    console.log(`✅ Found ${notesSnapshot.size} notes in Firestore`);
    
    notesSnapshot.docs.forEach((doc, index) => {
      const data = doc.data();
      console.log(`\n📝 Note ${index + 1}: ${data.title}`);
      console.log(`   ID: ${doc.id}`);
      console.log(`   Storage Type: ${data.storageType}`);
      console.log(`   College ID: ${data.collegeId}`);
      console.log(`   Department ID: ${data.departmentId}`);
      console.log(`   Subject IDs: ${data.subjectIds ? JSON.stringify(data.subjectIds) : 'None'}`);
      console.log(`   Education Year: ${data.educationYear}`);
      console.log(`   Semester: ${data.semester}`);
      console.log(`   File URL: ${data.fileUrl ? data.fileUrl.substring(0, 50) + '...' : 'None'}`);
    });
    
    // Test subject filtering query
    if (notesSnapshot.size > 0) {
      const firstNote = notesSnapshot.docs[0];
      const noteData = firstNote.data();
      
      if (noteData.subjectIds && noteData.subjectIds.length > 0) {
        console.log(`\n🔍 Testing subject filter query...`);
        const subjectId = noteData.subjectIds[0];
        console.log(`   Filtering by subject ID: ${subjectId}`);
        
        const filteredSnapshot = await db.collection('notes')
          .where('subjectIds', 'array-contains', subjectId)
          .get();
        
        console.log(`✅ Subject filter found: ${filteredSnapshot.size} notes`);
      } else {
        console.log(`\n⚠️  First note has no subjects to test filtering`);
      }
    }
    
    console.log('\n🎉 Firestore note test completed!');
    
  } catch (error) {
    console.error('❌ Firestore note test failed:', error.message);
  }
}

testFirestoreNote();